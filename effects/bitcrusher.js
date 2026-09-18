window.Effect_Bitcrusher = {
    type: 'bitcrusher',
    label: 'Staircase Step Bitcrusher',
    theme: 'teal',
    knobs: [
        { key: 'bits',  label: 'Grid Resolution', min: 0.5, max: 8.0, step: 0.001, isLog: true, unit: 'Bits' },
        { key: 'blend', label: 'Crush Blend',     min: 0.0, max: 1.0,  step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, bits: 5.0, blend: 0.60 };
    },

    validate(g, fx) {
        fx.bits = parseFloat(Math.max(2.0, Math.min(16.0, parseFloat(fx.bits) || 5.0)).toFixed(1));
        fx.blend = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.blend ?? 0.60))).toFixed(2));
    },

    process(ctx) {
        const { sample, fx } = ctx;
        const stepCount = Math.pow(2.0, fx.bits);
        const crushedSample = Math.round(sample * stepCount) / stepCount;

        return sample * (1.0 - fx.blend) + crushedSample * fx.blend;
    }
};
