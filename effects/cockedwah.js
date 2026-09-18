window.Effect_CockedWah = {
    type: 'cockedwah',
    label: 'Frozen Resonant Cocked Wah',
    theme: 'lime',
    knobs: [
        { key: 'centerFreq', label: 'Filter Position', min: 50, max: 4000, step: 1,    isLog: true,  unit: 'Hz' },
        { key: 'resonance',  label: 'Peak Sharpness', min: 1.0, max: 15.0, step: 0.1,  isLog: false, unit: 'Q' },
        { key: 'mix',        label: 'Wah Mix',        min: 0.0, max: 1.0,  step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, centerFreq: 1100, resonance: 6.0, mix: 1.00 };
    },

    validate(g, fx) {
        fx.centerFreq = parseFloat(Math.max(400, Math.min(2500, parseFloat(fx.centerFreq) || 1100)).toFixed(0));
        fx.resonance = parseFloat(Math.max(1.0, Math.min(15.0, parseFloat(fx.resonance) || 6.0)).toFixed(1));
        fx.mix = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.mix ?? 1.00))).toFixed(2));
    },

    process(ctx) {
        const { sample, fx, smoothState, sampleRate } = ctx;
        if (!smoothState) return sample;

        smoothState.wah_low = smoothState.wah_low || 0;
        smoothState.wah_band = smoothState.wah_band || 0;

        const f = 2.0 * Math.sin(Math.PI * fx.centerFreq / sampleRate);
        const q = 1.0 / fx.resonance;

        const high = sample - smoothState.wah_low - q * smoothState.wah_band;
        smoothState.wah_band += f * high;
        smoothState.wah_low += f * smoothState.wah_band;

        const filteredSample = smoothState.wah_band * (1.0 + fx.resonance * 0.2);

        const wet = Math.atan(filteredSample * 2.0) / Math.atan(2.0);
        return sample * (1.0 - fx.mix) + wet * fx.mix;
    }
};
