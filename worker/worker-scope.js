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
                        let warpedT = t;
                        let isWarped = false;
                        let warpFx = null;

                        if (activeWarpers.length > 0) {
                            warpFx = activeWarpers[0];
                            const period = warpFx.warpPeriod;
                            const cutoff = warpFx.zeroCutoff;

                            const doublePeriod = 2 * period;
                            let localT = Math.abs(t) % doublePeriod;
                            if (localT > period) localT = doublePeriod - localT;
                            if (localT < cutoff) localT = cutoff;

                            let rawWarpedT = (period * cutoff) / localT;
                            
                            // Proportional timeline crossfade for the visual tracer
                            warpedT = rawWarpedT * warpFx.warpIntensity + t * (1.0 - warpFx.warpIntensity);
                            isWarped = true;
                        }

                        // --- GENERATE AND DISPATCH AUDIO SAMPLES ---
                        let componentLeft = 0;

                        if (activeMultipliers.length > 0) {
                            let currentSample = workerScope.AudioWorker.getWaveSample(
                                gen.type,
                                2 * Math.PI * s.frequency * warpedT,
                                warpedT,
                                s.frequency
                            );

                            for (let j = 0; j < activeMultipliers.length; j++) {
                                const fx = activeMultipliers[j];
                                const plugin = workerScope.AudioWorker.Plugins ? workerScope.AudioWorker.Plugins[fx.type] : null;
                                if (plugin) {
                                    currentSample = plugin.process(currentSample, t, s, fx, (type, angle, subT, freq) => {
                                        if (isWarped && warpFx) {
                                            let subLocalT = Math.abs(subT) % (2 * warpFx.warpPeriod);
                                            if (subLocalT > warpFx.warpPeriod) subLocalT = (2 * warpFx.warpPeriod) - subLocalT;
                                            if (subLocalT < warpFx.zeroCutoff) subLocalT = warpFx.zeroCutoff;
                                            
                                            let rawSubWarpedT = (warpFx.warpPeriod * warpFx.zeroCutoff) / subLocalT;
                                            let finalSubWarpedT = rawSubWarpedT * warpFx.warpIntensity + subT * (1.0 - warpFx.warpIntensity);
                                            
                                            return workerScope.AudioWorker.getWaveSample(type, 2 * Math.PI * freq * finalSubWarpedT, finalSubWarpedT, freq);
                                        }
                                        return workerScope.AudioWorker.getWaveSample(type, angle, subT, freq);
                                    }, gen.type);
                                }
                            }
                            componentLeft = currentSample;
                        } else {
                            componentLeft = workerScope.AudioWorker.getWaveSample(gen.type, 2 * Math.PI * s.frequency * warpedT, warpedT, s.frequency);
                        }

                        let componentRight = componentLeft;

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