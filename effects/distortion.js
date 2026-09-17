window.Effect_Distortion = {
    type: 'distortion',
    label: 'Hard-Clipping Distortion Box',
    theme: 'orange',
    knobs: [
        { key: 'gain',      label: 'Distortion Gain', min: 1.0, max: 10.0, step: 0.1,  isLog: false, unit: 'x' },
        { key: 'threshold', label: 'Clip Threshold',  min: 0.1, max: 1.0,  step: 0.01, isLog: false, unit: 'Ceil' },
        { key: 'mix',       label: 'Distortion Mix',  min: 0.0, max: 1.0,  step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, gain: 3.0, threshold: 0.50, mix: 1.0 };
    },

    validate(g, fx) {
        fx.gain = parseFloat(Math.max(1.0, Math.min(10.0, parseFloat(fx.gain) || 3.0)).toFixed(1));
        fx.threshold = parseFloat(Math.max(0.1, Math.min(1.0, parseFloat(fx.threshold) || 0.50)).toFixed(2));
        fx.mix = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.mix ?? 1.0))).toFixed(2));
    },

    process(ctx) {
        const { sample, fx } = ctx;
        const gain = fx.gain;
        const thresh = fx.threshold;
        const mix = fx.mix;

        const amplified = sample * gain;
        const clipped = Math.max(-thresh, Math.min(thresh, amplified));
        const wetSample = (clipped / thresh);

        return sample * (1.0 - mix) + wetSample * mix;
    }
};
