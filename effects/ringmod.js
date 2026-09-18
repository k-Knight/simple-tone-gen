window.Effect_RingMod = {
    type: 'ringmod',
    label: 'Industrial Frequency Shifter',
    theme: 'sky',
    knobs: [
        { key: 'frequency', label: 'Carrier Freq', min: 1.0, max: 4000.0, step: 0.01,  isLog: true,  unit: 'Hz' },
        { key: 'waveType',  label: 'Carrier Shape',min: 0,   max: 1,      step: 1,    isLog: false, unit: 'Type', resetState: true },
        { key: 'mix',       label: 'Ring Mix',     min: 0.0, max: 1.0,    step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, frequency: 440.0, waveType: 0, mix: 0.50 };
    },

    validate(g, fx) {
        fx.frequency = parseFloat(Math.max(1.0, Math.min(2000.0, parseFloat(fx.frequency) || 440.0)).toFixed(0));
        fx.waveType = Math.max(0, Math.min(1, Math.round(parseFloat(fx.waveType)) || 0));
        fx.mix = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.mix ?? 0.50))).toFixed(2));
    },

    process(ctx) {
        const { sample, baseT, fx } = ctx;

        const carrierAngle = 2.0 * Math.PI * fx.frequency * baseT;

        const isSine = 1.0 - fx.waveType;
        const sineCarrier = Math.sin(carrierAngle);
        
        const modX = ((carrierAngle / (2.0 * Math.PI)) % 1 + 1) % 1;
        const triCarrier = 1.0 - 4.0 * Math.abs(Math.round(modX) - modX);

        const carrierSignal = (isSine * sineCarrier) + (fx.waveType * triCarrier);

        const wetSample = sample * carrierSignal;

        return sample * (1.0 - fx.mix) + wetSample * fx.mix;
    }
};
