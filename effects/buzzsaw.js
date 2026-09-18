window.Effect_Buzzsaw = {
    type: 'buzzsaw',
    label: 'HM-2 Swedish Buzzsaw',
    theme: 'fuchsia',
    knobs: [
        { key: 'grind', label: 'Saw Teeth (Mid)', min: 1.0, max: 20.0, step: 0.1,  isLog: false, unit: 'Grnd' },
        { key: 'chains', label: 'Drive Volume',  min: 1.0, max: 10.0, step: 0.1,  isLog: false, unit: 'Drve' },
        { key: 'mix',    label: 'Buzzsaw Mix',    min: 0.0, max: 1.0,  step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, grind: 8.0, chains: 4.0, mix: 1.00 };
    },

    validate(g, fx) {
        fx.grind = parseFloat(Math.max(1.0, Math.min(20.0, parseFloat(fx.grind) || 8.0)).toFixed(1));
        fx.chains = parseFloat(Math.max(1.0, Math.min(10.0, parseFloat(fx.chains) || 4.0)).toFixed(1));
        fx.mix = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.mix ?? 1.00))).toFixed(2));
    },

    process(ctx) {
        const { sample, fx, smoothState } = ctx;
        if (!smoothState) return sample;

        smoothState.hm2_y1 = smoothState.hm2_y1 || 0;
        smoothState.hm2_y2 = smoothState.hm2_y2 || 0;

        const x = sample;

        const d1 = x - smoothState.hm2_y1;
        smoothState.hm2_y1 += d1 * 0.15;
        const peak1 = d1 * fx.grind;

        const d2 = peak1 - smoothState.hm2_y2;
        smoothState.hm2_y2 += d2 * 0.18;
        const peak2 = d2 * (fx.grind * 0.8);

        const hotSignal = (x + peak1 + peak2) * fx.chains;
        const wetSample = Math.atan(hotSignal) / Math.atan(fx.chains * 2.0);
        
        return x * (1.0 - fx.mix) + wetSample * fx.mix;
    }
};
