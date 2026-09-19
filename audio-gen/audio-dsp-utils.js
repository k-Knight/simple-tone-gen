const TWO_PI = 6.283185307179586;
const SAMPLE_RATE = 48000;
const BUFFER_LENGTH = 2048;
const MAX_SCOPE_RING_BUFFER = 16384;
const VISUAL_POINTS = 800;

const ADJUSTMENT_RATE = 0.01;
const PHASE_SMOOTH_FACTOR = 0.005;
const FX_SMOOTH_FACTOR = 0.005;

const DEFAULT_FALLBACK_FREQ = 200;
const ABSOLUTE_MIN_FREQ = 20;
const ABSOLUTE_MAX_FREQ = 20000;
const SCALE_START_HZ = 500;
const SCALE_END_HZ = 20000;

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
        let lowestFreq = ABSOLUTE_MAX_FREQ;
        let hasActiveGen = false;

        if (!engineState || !engineState.generators || !engineState.smoothState) {
            return ABSOLUTE_MIN_FREQ;
        }

        for (let [genId, gen] of engineState.generators) {
            const s = engineState.smoothState.get(genId);

            if (!gen.isMuted && s && s.loudness > 0.0001) {
                lowestFreq = Math.min(lowestFreq, parseFloat(s.frequency) || ABSOLUTE_MIN_FREQ);
                hasActiveGen = true;
            }
        }

        if (!hasActiveGen || lowestFreq < ABSOLUTE_MIN_FREQ) {
            return ABSOLUTE_MIN_FREQ;
        }

        return lowestFreq;
    }
};
