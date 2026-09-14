(function() {
    const scope = typeof window !== 'undefined' ? window : self;
    scope.AudioWorker = scope.AudioWorker || {};

    scope.AudioWorker.scopeState = "WAIT_HALF_PERIOD";
    scope.AudioWorker.scopeTargetSamples = 0;
    scope.AudioWorker.scopeSampleCounter = 0;
    scope.AudioWorker.scopeStateCaptureStartTime = 0;
    scope.AudioWorker.VISUAL_POINTS = 800;

    scope.AudioWorker.resetScopeState = function(generators, sampleRate) {
        const workerScope = typeof window !== 'undefined' ? window : self;
        workerScope.AudioWorker.scopeState = "WAIT_HALF_PERIOD";
        
        let lowestFreq = 50; 
        let activeGens = Array.from(generators.values()).filter(g => !g.isMuted);
        if (activeGens.length > 0) {
            lowestFreq = Math.min(...activeGens.map(g => parseFloat(g.frequency) || 50));
        }
        if (lowestFreq < 20) lowestFreq = 20;

        let samplesPerPeriod = sampleRate / lowestFreq;
        
        let periodsToCapture = 2;
        if (samplesPerPeriod * 2 < 500) {
            periodsToCapture = Math.ceil(500 / samplesPerPeriod);
            if (periodsToCapture % 2 !== 0) {
                periodsToCapture++;
            }
        }
        
        workerScope.AudioWorker.scopeTargetSamples = Math.round(samplesPerPeriod * periodsToCapture);
    };

    scope.AudioWorker.processScopeWindow = function(masterLeftSample, phaseTimeline, sampleRate, generators, smoothState) {
        const workerScope = typeof window !== 'undefined' ? window : self;
        if (workerScope.AudioWorker.scopeTargetSamples === 0) return;

        let singlePeriodSamples = sampleRate / 50;
        let activeGens = Array.from(generators.values()).filter(g => !g.isMuted);
        if (activeGens.length > 0) {
            let lowestFreq = Math.min(...activeGens.map(g => parseFloat(g.frequency) || 50));
            singlePeriodSamples = sampleRate / (lowestFreq < 20 ? 20 : lowestFreq);
        }

        let currentCyclePosition = phaseTimeline % singlePeriodSamples;
        let halfPeriodSamples = singlePeriodSamples / 2.0;
        let currentTime = phaseTimeline / sampleRate;

        if (workerScope.AudioWorker.scopeState === "WAIT_HALF_PERIOD") {
            if (currentCyclePosition >= halfPeriodSamples) {
                workerScope.AudioWorker.scopeState = "CAPTURING";
                workerScope.AudioWorker.scopeStateCaptureStartTime = currentTime;
                workerScope.AudioWorker.scopeSampleCounter = 0;
            }
        }

        if (workerScope.AudioWorker.scopeState === "CAPTURING") {
            workerScope.AudioWorker.scopeSampleCounter++;

            if (workerScope.AudioWorker.scopeSampleCounter >= workerScope.AudioWorker.scopeTargetSamples) {
                let visualOutput = new Float32Array(workerScope.AudioWorker.VISUAL_POINTS);
                let totalDurationSeconds = workerScope.AudioWorker.scopeTargetSamples / sampleRate;

                for (let v = 0; v < workerScope.AudioWorker.VISUAL_POINTS; v++) {
                    let fraction = v / (workerScope.AudioWorker.VISUAL_POINTS - 1);
                    let evalTime = workerScope.AudioWorker.scopeStateCaptureStartTime + (fraction * totalDurationSeconds);
                    let renderMixSum = 0;

                    for (let [genId, gen] of generators) {
                        if (gen.isMuted) continue;
                        const s = smoothState.get(genId);
                        if (!s || s.loudness <= 0.0001) continue;

                        let t = evalTime - s.timeShift;
                        
                        let componentLeft = workerScope.AudioWorker.getWaveSample(gen.type, 2 * Math.PI * s.frequency * t, t, s.frequency);
                        let componentRight = componentLeft;

                        // --- UNIFIED MODULAR EFFECTS DISPATCHER SYSTEM SECTION ---
                        if (gen.effects) {
                            for (let j = 0; j < gen.effects.length; j++) {
                                const fx = gen.effects[j];
                                // Read the dynamic string-serialized math formula pushed into memory by audio-engine.js
                                const plugin = workerScope.AudioWorker.Plugins ? workerScope.AudioWorker.Plugins[fx.type] : null;
                                if (plugin) {
                                    componentLeft = plugin.process(componentLeft, t, s, fx, workerScope.AudioWorker.getWaveSample, gen.type);
                                    componentRight = componentLeft;
                                }
                            }
                        }

                        if (gen.isInverted) {
                            componentLeft = -componentLeft;
                            componentRight = -componentRight;
                        }

                        const mixedMonoChannel = (componentLeft + componentRight) / 2.0;
                        renderMixSum += mixedMonoChannel * s.loudness;
                    }
                    
                    visualOutput[v] = isNaN(renderMixSum) ? 0.0 : renderMixSum;
                }

                self.postMessage({ 
                    action: 'scope-update', 
                    visualData: visualOutput 
                }, [visualOutput.buffer]);

                workerScope.AudioWorker.scopeState = "WAIT_HALF_PERIOD";
            }
        }
    };
})();
