window.AudioWorkerTextModule = {
    code: `
    // Safely declare references checking self directly instead of an external block global param
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

        if (action === 'add') {
            generators.set(id, params);
            phaseTimeline = 0;
            smoothState.delete(id);
            resetScopeState(generators, sampleRate);
        } else if (action === 'update') {
            if (generators.has(id)) {
                generators.set(id, params);
                phaseTimeline = 0;
                smoothState.delete(id);
                threadMuteTimeoutSamples = bufferLength * 3;
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
                            timeShift: gen.timeShift,
                            superDetune: 1.5,
                            superLoudness: 0.5
                        });
                    }

                    const s = smoothState.get(genId);
                    const factor = 0.002;

                    s.frequency += (gen.frequency - s.frequency) * factor;
                    s.loudness += (gen.loudness - s.loudness) * factor;
                    s.pan += (gen.pan - s.pan) * factor;
                    s.timeShift += (gen.timeShift - s.timeShift) * factor;

                    if (s.loudness <= 0.0001) continue;

                    const t = currentTime - s.timeShift;
                    let sampleValue = 0;

                    const superFx = gen.effects ? gen.effects.find(fx => fx.type === 'super') : null;

                    if (superFx) {
                        s.superDetune += (superFx.superDetune - s.superDetune) * factor;
                        s.superLoudness += (superFx.superLoudness - s.superLoudness) * factor;

                        sampleValue += getWaveSample(gen.type, 2 * Math.PI * s.frequency * t, t, s.frequency);
                        const mode = Math.round(superFx.superMode);

                        if (mode === 0 || mode === 1) {
                            let fUpper = s.frequency + s.superDetune;
                            sampleValue += getWaveSample(gen.type, 2 * Math.PI * fUpper * t, t, fUpper) * s.superLoudness;
                        }
                        if (mode === 0 || mode === 2) {
                            let fLower = s.frequency - s.superDetune;
                            sampleValue += getWaveSample(gen.type, 2 * Math.PI * fLower * t, t, fLower) * s.superLoudness;
                        }
                        sampleValue /= (1.0 + (mode === 0 ? 2 : 1) * s.superLoudness);
                    } else {
                        sampleValue = getWaveSample(gen.type, 2 * Math.PI * s.frequency * t, t, s.frequency);
                    }

                    if (gen.isInverted) sampleValue = -sampleValue;

                    const volumeClamped = sampleValue * s.loudness;
                    const panNormalized = (s.pan + 1) / 2; 
                    const gainLeft = Math.cos(panNormalized * Math.PI / 2);
                    const gainRight = Math.sin(panNormalized * Math.PI / 2);

                    masterLeftSample += volumeClamped * gainLeft;
                    masterRightSample += volumeClamped * gainRight;
                }

                leftChannel[i] = masterLeftSample;
                rightChannel[i] = masterRightSample;

                processScopeWindow(masterLeftSample, phaseTimeline, sampleRate, generators, smoothState);

                phaseTimeline++;
            }

            self.postMessage({ leftChannel, rightChannel }, [leftChannel.buffer, rightChannel.buffer]);
        }
    };
    `
};
