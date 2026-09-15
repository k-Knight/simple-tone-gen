window.AudioDspModule = {
    calculateBlock(engineState, bufferLength, leftChannel, rightChannel, sampleRate) {
        const getWaveSample = window.AudioWorker.getWaveSample;
        const processScopeWindow = window.AudioWorker.processScopeWindow;

        for (let i = 0; i < bufferLength; i++) {
            const currentTime = engineState.phaseTimeline / sampleRate;
            let masterLeftSample = 0;
            let masterRightSample = 0;

            for (let [genId, gen] of engineState.generators) {
                if (gen.isMuted) continue;

                if (!engineState.smoothState.has(genId)) {
                    engineState.smoothState.set(genId, {
                        frequency: gen.frequency,
                        loudness: gen.loudness,
                        pan: gen.pan,
                        timeShift: gen.timeShift
                    });
                }

                const s = engineState.smoothState.get(genId);
                const factor = 0.002;

                s.frequency += (gen.frequency - s.frequency) * factor;
                s.loudness += (gen.loudness - s.loudness) * factor;
                s.pan += (gen.pan - s.pan) * factor;
                s.timeShift += (gen.timeShift - s.timeShift) * factor;

                if (s.loudness <= 0.0001) continue;

                let baseT = currentTime - s.timeShift;

                let activeWarpers = [];
                let activeMultipliers = [];

                if (gen.effects) {
                    for (let j = 0; j < gen.effects.length; j++) {
                        const fx = gen.effects[j];
                        if (fx.type === 'hyperbolic') {
                            activeWarpers.push(fx);
                        } else {
                            activeMultipliers.push(fx);
                        }
                    }
                }

                let warpedT = baseT;
                let isWarped = false;
                let warpFx = null;

                if (activeWarpers.length > 0) {
                    warpFx = activeWarpers[0];
                    const period = warpFx.warpPeriod;
                    const cutoff = warpFx.zeroCutoff;

                    const doublePeriod = 2 * period;
                    let localT = Math.abs(baseT) % doublePeriod;
                    if (localT > period) localT = doublePeriod - localT;
                    if (localT < cutoff) localT = cutoff;

                    let rawWarpedT = (period * cutoff) / localT;
                    warpedT = rawWarpedT * warpFx.warpIntensity + baseT * (1.0 - warpFx.warpIntensity);
                    isWarped = true;
                }

                let voiceSampleLeft = 0;

                if (activeMultipliers.length > 0) {
                    let currentSample = getWaveSample(gen.type, 2 * Math.PI * s.frequency * warpedT, warpedT, s.frequency);

                    for (let j = 0; j < activeMultipliers.length; j++) {
                        const fx = activeMultipliers[j];
                        const plugin = window.EffectRegistry[fx.type] || null;
                        if (plugin && plugin.process) {
                            currentSample = plugin.process(currentSample, baseT, s, fx, (type, angle, subT, freq) => {
                                if (isWarped && warpFx) {
                                    let subLocalT = Math.abs(subT) % (2 * warpFx.warpPeriod);
                                    if (subLocalT > warpFx.warpPeriod) subLocalT = (2 * warpFx.warpPeriod) - subLocalT;
                                    if (subLocalT < warpFx.zeroCutoff) subLocalT = warpFx.zeroCutoff;
                                    
                                    let rawSubWarpedT = (warpFx.warpPeriod * warpFx.zeroCutoff) / subLocalT;
                                    let finalSubWarpedT = rawSubWarpedT * warpFx.warpIntensity + subT * (1.0 - warpFx.warpIntensity);
                                    
                                    return getWaveSample(type, 2 * Math.PI * freq * finalSubWarpedT, finalSubWarpedT, freq);
                                }
                                return getWaveSample(type, angle, subT, freq);
                            }, gen.type);
                        }
                    }
                    voiceSampleLeft = currentSample;
                } else {
                    voiceSampleLeft = getWaveSample(gen.type, 2 * Math.PI * s.frequency * warpedT, warpedT, s.frequency);
                }

                let voiceSampleRight = voiceSampleLeft;

                if (gen.isInverted) {
                    voiceSampleLeft = -voiceSampleLeft;
                    voiceSampleRight = -voiceSampleRight;
                }

                const volClampedLeft = voiceSampleLeft * s.loudness;
                const volClampedRight = voiceSampleRight * s.loudness;

                const panNormalized = (s.pan + 1) / 2;
                const gainLeft = Math.cos(panNormalized * Math.PI / 2);
                const gainRight = Math.sin(panNormalized * Math.PI / 2);

                masterLeftSample += volClampedLeft * gainLeft;
                masterRightSample += volClampedRight * gainRight;
            }

            leftChannel[i] = masterLeftSample;
            rightChannel[i] = masterRightSample;

            processScopeWindow(masterLeftSample, engineState.phaseTimeline, sampleRate, engineState.generators, engineState.smoothState);
            engineState.phaseTimeline++;
        }
    }
};
