window.AudioDspUtils = {
    initGlobalWarpTimeline(engineState) {
        if (engineState.globalWarpPhase === undefined) {
            engineState.globalWarpPhase = 0;
            engineState.globalWarpDirection = 1;
            engineState.smoothWarpPeriod = 0.15;
        }
    },

    initGeneratorSmoothingState(engineState, genId, gen) {
        if (!engineState.smoothState.has(genId)) {
            engineState.smoothState.set(genId, {
                frequency: gen.frequency,
                loudness: gen.loudness,
                pan: gen.pan,
                timeShift: gen.timeShift,
                phaseAccumulator: 0,
                fxPhases: {}
            });
        }
    },

    getLowestActiveFrequency(generators) {
        let lowestFreq = 50;
        for (let [_, gen] of generators) {
            if (!gen.isMuted) {
                lowestFreq = Math.min(lowestFreq, parseFloat(gen.frequency) || 50);
            }
        }
        return lowestFreq < 20 ? 20 : lowestFreq;
    },

    getHyperbolicMasterPeriod(generators) {
        for (let [_, gen] of generators) {
            if (gen.isMuted || !gen.effects) continue;
            const fx = gen.effects.find(e => e.type === 'hyperbolic');
            if (fx) return parseFloat(fx.warpPeriod) || 0.15;
        }
        return 0.15;
    },

    advanceGlobalWarpPhase(engineState, sharedPeriod, sampleRate) {
        if (sharedPeriod > 0.0001) {
            engineState.globalWarpPhase += engineState.globalWarpDirection * (1.0 / sampleRate);
            if (engineState.globalWarpPhase >= sharedPeriod) {
                engineState.globalWarpPhase = sharedPeriod;
                engineState.globalWarpDirection = -1;
            } else if (engineState.globalWarpPhase <= 0) {
                engineState.globalWarpPhase = 0;
                engineState.globalWarpDirection = 1;
            }
        }
    },

    categorizeEffects(effects) {
        const activeWarpers = [];
        const activeMultipliers = [];
        if (effects) {
            for (let j = 0; j < effects.length; j++) {
                const fx = effects[j];
                if (fx.type === 'hyperbolic') activeWarpers.push(fx);
                else activeMultipliers.push(fx);
            }
        }
        return { activeWarpers, activeMultipliers };
    }
};
