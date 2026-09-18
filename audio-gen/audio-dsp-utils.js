window.AudioDspUtils = {
    initGeneratorSmoothingState(engineState, genId, gen) {
        if (!engineState.smoothState.has(genId)) {
            engineState.smoothState.set(genId, {
                frequency: gen.frequency,
                loudness: gen.loudness,
                pan: gen.pan,
                timeShift: gen.timeShift,
                k: gen.k,
                pow: gen.pow,
                phaseAccumulator: 0,
                fxPhases: {}
            });
        }
    },

    getLowestActiveFrequency(engineState) {
        let lowestFreq = 20000;
        let hasActiveGen = false;

        if (!engineState || !engineState.generators || !engineState.smoothState) {
            return 20;
        }

        for (let [genId, gen] of engineState.generators) {
            const s = engineState.smoothState.get(genId);

            if (!gen.isMuted && s && s.loudness > 0.0001) {
                lowestFreq = Math.min(lowestFreq, parseFloat(s.frequency) || 20);
                hasActiveGen = true;
            }
        }

        if (!hasActiveGen || lowestFreq < 20) {
            return 20;
        }

        return lowestFreq;
    }
};
