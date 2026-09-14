window.AudioWorkerTextModule = {
    // Stored directly as a pure string literal. No more string manipulation syntax bugs!
    workerSourceCode: `
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

                        const baseT = currentTime - s.timeShift;
                        let voiceSampleLeft = getWaveSample(gen.type, 2 * Math.PI * s.frequency * baseT, baseT, s.frequency);
                        let voiceSampleRight = voiceSampleLeft;

                        // --- UNIFIED MODULAR PLUGIN EFFECT LOOP ---
                        if (gen.effects) {
                            for (let j = 0; j < gen.effects.length; j++) {
                                const fx = gen.effects[j];
                                const plugin = self.AudioWorker.Plugins ? self.AudioWorker.Plugins[fx.type] : null;
                                if (plugin) {
                                    voiceSampleLeft = plugin.process(voiceSampleLeft, baseT, s, fx, getWaveSample, gen.type);
                                    voiceSampleRight = voiceSampleLeft;
                                }
                            }
                        }
                        // --- END MODULAR PLUGIN EFFECT LOOP ---

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
    `
};
