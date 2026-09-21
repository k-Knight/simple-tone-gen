window.Effect_Fuzz = {
    type: 'fuzz',
    label: 'Fuzz Effect',
    theme: 'pink',
    knobs: [
        { key: 'fuzzIntensity', label: 'Sustain / Drive', min: 1.0, max: 20.0, step: 0.1,  isLog: false, unit: 'Sust' },
        { key: 'bias',          label: 'Asymmetry',       min: -0.5, max: 0.5,  step: 0.01, isLog: false, unit: 'Bias' },
        { key: 'blend',         label: 'Fuzz Mix',        min: 0.0, max: 1.0,  step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, fuzzIntensity: 5.0, bias: 0.00, blend: 0.80 };
    },

    validate(g, fx) {
        fx.fuzzIntensity = parseFloat(Math.max(1.0, Math.min(20.0, parseFloat(fx.fuzzIntensity) || 5.0)).toFixed(1));
        fx.bias = parseFloat(Math.max(-0.5, Math.min(0.5, parseFloat(fx.bias) || 0.00)).toFixed(2));
        fx.blend = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.blend ?? 0.80))).toFixed(2));
    },

    process(ctx) {
        const { sample, fx } = ctx;
        const intensity = fx.fuzzIntensity;
        const bias = fx.bias;
        const blend = fx.blend;

        const biasedInput = sample * intensity + bias;
        const absVal = Math.abs(biasedInput);
        
        const fuzzedSample = Math.sign(biasedInput) * (1.0 - Math.exp(-absVal));
        const maxPossible = 1.0 - Math.exp(-(intensity + Math.abs(bias)));
        const normalizedFuzz = fuzzedSample / maxPossible;
        const finalFuzz = normalizedFuzz - bias * 0.5;

        return sample * (1.0 - blend) + finalFuzz * blend;
    }
};
