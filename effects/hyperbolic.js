window.Effect_Hyperbolic = {
    type: 'hyperbolic',
    label: 'Hyperbolic Wave-Warp Modulator',
    theme: 'rose',

    knobs: [
        { key: 'warpPeriod', label: 'Warp Period Time', min: 0.0001, max: 10.0, step: 0.0001, isLog: true, unit: 'Sec' },
        { key: 'zeroCutoff', label: 'Zero Chaos Cutoff', min: 0.001, max: 0.5, step: 0.001, isLog: true, unit: 'Cut' },
        { key: 'warpIntensity', label: 'Modulation Depth', min: 0.0, max: 1.0, step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, warpPeriod: 0.15, zeroCutoff: 0.030, warpIntensity: 0.75 };
    },

    validate(fx) {
        fx.warpPeriod = parseFloat(Math.max(0.01, Math.min(10.0, parseFloat(fx.warpPeriod) || 0.15)).toFixed(3));
        fx.zeroCutoff = parseFloat(Math.max(0.001, Math.min(0.5, parseFloat(fx.zeroCutoff) || 0.030)).toFixed(4));
        fx.warpIntensity = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.warpIntensity) || 0.75)).toFixed(2));
    },

    process(sample, baseT, s, fx, getWaveSample, waveType) {
        const period = fx.warpPeriod;
        const cutoff = fx.zeroCutoff;
        const intensity = fx.warpIntensity;

        // Mirror time periodically using a triangular window framework [0, period]
        const doublePeriod = 2 * period;
        let localT = Math.abs(baseT) % doublePeriod;
        if (localT > period) {
            localT = doublePeriod - localT;
        }

        // Bound local time away from 0 to neutralize hyper-chaotic infinities
        if (localT < cutoff) {
            localT = cutoff;
        }

        // Transform linear time scale into a hyperbolic phase velocity projection path
        const hyperbolicTime = (period * cutoff) / localT;

        // Synthesize the warped wave sample matching the target oscillator blueprint
        const warpedSample = getWaveSample(waveType, 2 * Math.PI * s.frequency * hyperbolicTime, hyperbolicTime, s.frequency);

        // Crossfade between dry sample context and warped signal output
        return sample * (1.0 - intensity) + warpedSample * intensity;
    }
};
