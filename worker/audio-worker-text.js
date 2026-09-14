window.AudioWorkerTextModule = {
    workerBody() {
        const getWaveSample = self.AudioWorker.getWaveSample;
        const resetScopeState = self.AudioWorker.resetScopeState;
        const processScopeWindow = self.AudioWorker.processScopeWindow;

        let generators = new Map();
        let smoothState = new Map();
        let phaseTimeline = 0;
        let sampleRate = 48000;
        let threadMuteTimeoutSamples = 0;

        self.onmessage = function(e) {
            const { action, id, params, bufferLength } = e.data;

            if (action === 'add' || action === 'update') {
                if (action === 'add' || generators.has(id)) {
                    generators.set(id, params);
                    phaseTimeline = 0;
                    smoothState.delete(id);
                    if (action === 'update') threadMuteTimeoutSamples = bufferLength * 3;
                    resetScopeState(generators, sampleRate);
                }
            } else if (action === 'remove') {
                generators.delete(id);
                smoothState.delete(id);
                resetScopeState(generators, sampleRate);
            } else if (action === 'process') {
                const leftChannel = new Float32Array(bufferLength);
                const rightChannel = new Float32Array(bufferLength);

                if (threadMuteTimeoutSamples > 0) {
                    threadMuteTimeoutSamples -= bufferLength;
                    self.postMessage({ leftChannel, rightChannel, scopeData: null }, [leftChannel.buffer, rightChannel.buffer]);
                    return;
                }

                if (self.AudioWorker.scopeTargetSamples === 0) {
                    resetScopeState(generators, sampleRate);
                }

                for (let i = 0; i < bufferLength; i++) {
                    const currentTime = phaseTimeline / sampleRate;
                    let masterLeftSample = 0;
                    let masterRightSample = 0;

                    for (let [genId, gen] of generators) {
                        if (gen.isMuted) continue;

                        if (!smoothState.has(genId)) {
                            smoothState.set(genId, {
                                frequency: gen.frequency,
                                loudness: gen.loudness,
                                pan: gen.pan,
                                timeShift: gen.timeShift
                            });
                        }

                        const s = smoothState.get(genId);
                        const factor = 0.002;

                        s.frequency += (gen.frequency - s.frequency) * factor;
                        s.loudness += (gen.loudness - s.loudness) * factor;
                        s.pan += (gen.pan - s.pan) * factor;
                        s.timeShift += (gen.timeShift - s.timeShift) * factor;

                        if (s.loudness <= 0.0001) continue;

                        let baseT = currentTime - s.timeShift;

                        // --- EXTRACT AND CATEGORIZE EFFECTS ---
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

                        // --- TIME BASE PRE-WARP CALCULATION ---
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

                            warpedT = (period * cutoff) / localT;
                            isWarped = true;
                        }

                        // --- GENERATE AND DISPATCH AUDIO SAMPLES ---
                        let voiceSampleLeft = 0;

                        if (activeMultipliers.length > 0) {
                            let currentSample = getWaveSample(
                                gen.type,
                                2 * Math.PI * s.frequency * (isWarped ? warpedT : baseT),
                                (isWarped ? warpedT : baseT),
                                s.frequency
                            );

                            for (let j = 0; j < activeMultipliers.length; j++) {
                                const fx = activeMultipliers[j];
                                const plugin = self.AudioWorker.Plugins ? self.AudioWorker.Plugins[fx.type] : null;
                                if (plugin) {
                                    currentSample = plugin.process(currentSample, baseT, s, fx, (type, angle, subT, freq) => {
                                        if (isWarped && warpFx) {
                                            let subLocalT = Math.abs(subT) % (2 * warpFx.warpPeriod);
                                            if (subLocalT > warpFx.warpPeriod) subLocalT = (2 * warpFx.warpPeriod) - subLocalT;
                                            if (subLocalT < warpFx.zeroCutoff) subLocalT = warpFx.zeroCutoff;
                                            let subWarpedT = (warpFx.warpPeriod * warpFx.zeroCutoff) / subLocalT;
                                            
                                            // Calculate the fully warped wet sub-voice sample
                                            let wetSubSample = getWaveSample(type, 2 * Math.PI * freq * subWarpedT, subWarpedT, freq);
                                            // Calculate the clean dry sub-voice sample
                                            let drySubSample = getWaveSample(type, angle, subT, freq);
                                            
                                            // FIXED: Blend between dry and wet sub-voices using the modulation depth parameter
                                            return wetSubSample * warpFx.warpIntensity + drySubSample * (1.0 - warpFx.warpIntensity);
                                        }
                                        return getWaveSample(type, angle, subT, freq);
                                    }, gen.type);
                                }
                            }
                            voiceSampleLeft = currentSample;
                        } else {
                            let finalT = isWarped ? warpedT : baseT;
                            let rawSample = getWaveSample(gen.type, 2 * Math.PI * s.frequency * finalT, finalT, s.frequency);

                            if (isWarped && warpFx) {
                                voiceSampleLeft = rawSample * warpFx.warpIntensity +
                                                   getWaveSample(gen.type, 2 * Math.PI * s.frequency * baseT, baseT, s.frequency) * (1.0 - warpFx.warpIntensity);
                            } else {
                                voiceSampleLeft = rawSample;
                            }
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

                    processScopeWindow(masterLeftSample, phaseTimeline, sampleRate, generators, smoothState);
                    phaseTimeline++;
                }

                self.postMessage({ leftChannel, rightChannel }, [leftChannel.buffer, rightChannel.buffer]);
            }
        };
    }
};
