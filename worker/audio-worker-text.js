// Clean global namespace initialization container
window.AudioWorkerTextModule = {
    // Defined as a plain native executable container method block to give you full IDE syntax coloring
    functionBody() {
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
                                superLoudness: 0.75,
                                spreadTime: 0.0,
                                spreadLoudness: 0.5
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

                        const unisonFx = gen.effects ? gen.effects.find(fx => fx.type === 'unison') : null;
                        if (unisonFx) {
                            s.superDetune += (unisonFx.superDetune - s.superDetune) * factor;
                            s.superLoudness += (unisonFx.superLoudness - s.superLoudness) * factor;

                            let unisonMix = voiceSampleLeft;
                            const mode = Math.round(unisonFx.superMode);

                            if (mode === 0 || mode === 1) {
                                let fUpper = s.frequency + s.superDetune;
                                unisonMix += getWaveSample(gen.type, 2 * Math.PI * fUpper * baseT, baseT, fUpper) * s.superLoudness;
                            }
                            if (mode === 0 || mode === 2) {
                                let fLower = s.frequency - s.superDetune;
                                unisonMix += getWaveSample(gen.type, 2 * Math.PI * fLower * baseT, baseT, fLower) * s.superLoudness;
                            }
                            unisonMix /= (1.0 + (mode === 0 ? 2 : 1) * s.superLoudness);
                            voiceSampleLeft = unisonMix;
                            voiceSampleRight = unisonMix;
                        }

                        const timeSpreadFx = gen.effects ? gen.effects.find(fx => fx.type === 'timespread') : null;
                        if (timeSpreadFx) {
                            s.spreadTime += (timeSpreadFx.spreadTime - s.spreadTime) * factor; 
                            s.spreadLoudness += (timeSpreadFx.spreadLoudness - s.spreadLoudness) * factor;
                        
                            const mode = Math.round(timeSpreadFx.spreadMode);
                        
                            let subOscillationMix = 0;
                        
                            if (mode === 0) {
                                let tOffset = baseT - s.spreadTime;
                                subOscillationMix = getWaveSample(gen.type, 2 * Math.PI * s.frequency * tOffset, tOffset, s.frequency) * s.spreadLoudness;
                            } else {
                                let tPlus = baseT - s.spreadTime;
                                let tMinus = baseT + s.spreadTime;
                            
                                let v1 = getWaveSample(gen.type, 2 * Math.PI * s.frequency * tPlus, tPlus, s.frequency);
                                let v2 = getWaveSample(gen.type, 2 * Math.PI * s.frequency * tMinus, tMinus, s.frequency);
                            
                                subOscillationMix = ((v1 + v2) / 2.0) * s.spreadLoudness;
                            }
                        
                            voiceSampleLeft = (voiceSampleLeft + subOscillationMix) / (1.0 + s.spreadLoudness);
                            voiceSampleRight = (voiceSampleRight + subOscillationMix) / (1.0 + s.spreadLoudness);
                        }

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
