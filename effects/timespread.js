window.Effect_TimeSpread = {
    type: 'timespread',
    label: 'Stereo Haas Time-Spread Modulator',
    theme: 'cyan',

    knobs: [
        { key: 'periodOffset', label: 'Period Shift', min: -2.0, max: 2.0, step: 0.01, isLog: false, unit: 'Prd' },
        { key: 'spreadLoudness', label: 'Spread Voice Gain', min: 0, max: 2, step: 0.01, isLog: false, unit: 'Vol' },
        { key: 'spreadMode', label: 'Voice Density', min: 0, max: 1, step: 1, isLog: false, unit: 'Vcs', resetState: true }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, periodOffset: 0.0, spreadLoudness: 0.75, spreadMode: 0 };
    },

    validate(g, fx) {
        fx.periodOffset = parseFloat(Math.max(-2.0, Math.min(2.0, parseFloat(fx.periodOffset) || 0.0)).toFixed(2));
        fx.spreadLoudness = parseFloat(Math.max(0, Math.min(2, parseFloat(fx.spreadLoudness) || 0)).toFixed(2));
        fx.spreadMode = Math.max(0, Math.min(1, Math.round(parseFloat(fx.spreadMode)) || 0));
    },

    process(ctx) {
        const { sample, smoothState, fx, getWaveSample, waveType } = ctx;
        const TWO_PI = 6.283185307179586;

        const mode = Math.round(fx.spreadMode);
        let subOscillationMix = 0;

        const baseAngle = smoothState.phaseAccumulator;
        const phaseRotationOffset = fx.periodOffset * TWO_PI;

        if (mode === 0) {
            let rotatedAngle = baseAngle - phaseRotationOffset;
            subOscillationMix = getWaveSample(waveType, rotatedAngle, smoothState.k, smoothState.pow) * fx.spreadLoudness;
        } else {
            let rotatedAnglePlus = baseAngle - phaseRotationOffset;
            let rotatedAngleMinus = baseAngle + phaseRotationOffset;
            
            let v1 = getWaveSample(waveType, rotatedAnglePlus, smoothState.k, smoothState.pow);
            let v2 = getWaveSample(waveType, rotatedAngleMinus, smoothState.k, smoothState.pow);
            subOscillationMix = ((v1 + v2) / 2.0) * fx.spreadLoudness;
        }

        return (sample + subOscillationMix) / (1.0 + fx.spreadLoudness);
    }
};
