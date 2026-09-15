window.Effect_TimeSpread = {
    type: 'timespread',
    label: 'Stereo Haas Time-Spread Modulator',
    theme: 'cyan',

    knobs: [
        { key: 'spreadTime', label: 'Haas Time Shift', min: 'dynamic', max: 'dynamic', step: 'dynamic', isLog: false, unit: 'Sec' },
        { key: 'spreadLoudness', label: 'Spread Voice Gain', min: 0, max: 2, step: 0.01, isLog: false, unit: 'Vol' },
        { key: 'spreadMode', label: 'Voice Density', min: 0, max: 1, step: 1, isLog: false, unit: 'Vcs', resetState: true }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, spreadTime: 0.0, spreadLoudness: 0.75, spreadMode: 0 };
    },

    validate(g, fx) {
        const T = g && g.frequency > 0 ? (1.0 / g.frequency) : 0.05;
        fx.spreadTime = parseFloat(Math.max(-T, Math.min(T, parseFloat(fx.spreadTime) || 0.0)).toFixed(6));
        fx.spreadLoudness = parseFloat(Math.max(0, Math.min(2, parseFloat(fx.spreadLoudness) || 0)).toFixed(2));
        fx.spreadMode = Math.max(0, Math.min(1, Math.round(parseFloat(fx.spreadMode)) || 0));
    },

    process(ctx) {
        const { sample, baseT, smoothState, fx, getWaveSample, waveType } = ctx;

        const mode = Math.round(fx.spreadMode);
        let subOscillationMix = 0;

        const baseAngle = 2 * Math.PI * smoothState.frequency * baseT;
        const phaseRotationOffset = 2 * Math.PI * smoothState.frequency * fx.spreadTime;

        if (mode === 0) {
            let rotatedAngle = baseAngle - phaseRotationOffset;
            subOscillationMix = getWaveSample(waveType, rotatedAngle, baseT, smoothState.frequency, "M") * fx.spreadLoudness;
        } else {
            let rotatedAnglePlus = baseAngle - phaseRotationOffset;
            let rotatedAngleMinus = baseAngle + phaseRotationOffset;

            let v1 = getWaveSample(waveType, rotatedAnglePlus, baseT, smoothState.frequency, "L");
            let v2 = getWaveSample(waveType, rotatedAngleMinus, baseT, smoothState.frequency, "R");
            subOscillationMix = ((v1 + v2) / 2.0) * fx.spreadLoudness;
        }

        return (sample + subOscillationMix) / (1.0 + fx.spreadLoudness);
    }
};
