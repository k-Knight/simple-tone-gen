window.Effect_Overdrive = {
    type: 'overdrive',
    label: 'Vintage Overdrive Saturator',
    theme: 'amber',
    knobs: [
        { key: 'drive', label: 'Drive / Gain', min: 0.1, max: 10.0, step: 0.1, isLog: false, unit: 'x' },
        { key: 'tone',  label: 'Tone Filter',  min: 0.0, max: 1.0,  step: 0.01, isLog: false, unit: 'Tilt' },
        { key: 'mix',   label: 'Overdrive Mix', min: 0.0, max: 1.0,  step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, drive: 3.0, tone: 0.50, mix: 1.0 };
    },

    validate(g, fx) {
        fx.drive = parseFloat(Math.max(0.1, Math.min(10.0, parseFloat(fx.drive) || 3.0)).toFixed(1));
        fx.tone = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.tone) || 0.50)).toFixed(2));
        fx.mix = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.mix ?? 1.0))).toFixed(2));
    },

    process(ctx) {
        const { sample, fx, smoothState } = ctx;
        const drive = fx.drive;
        const tone = fx.tone;
        const mix = fx.mix;

        let filtered = sample;
        if (smoothState) {
            smoothState.lpStateOD = smoothState.lpStateOD || 0;
            smoothState.hpStateOD = smoothState.hpStateOD || 0;

            smoothState.lpStateOD += (sample - smoothState.lpStateOD) * 0.15;
            smoothState.hpStateOD = sample - smoothState.lpStateOD;

            filtered = smoothState.lpStateOD * (1.0 - tone) * 1.5 + smoothState.hpStateOD * tone * 2.5;
        }

        const rawOutput = Math.atan(filtered * drive);
        const maxCeiling = Math.atan(drive);
        const wetSample = maxCeiling > 0.0001 ? (rawOutput / maxCeiling) : rawOutput;

        return sample * (1.0 - mix) + wetSample * mix;
    }
};

window.EffectRegistry = window.EffectRegistry || {};
window.EffectRegistry.overdrive = window.Effect_Overdrive;
