window.Effect_TimeSpread = {
    type: 'timespread',
    label: 'Stereo Haas Time-Spread Modulator',
    theme: 'cyan',

    knobs: [
        // step will be calculated dynamically based on target frequency or left fallback
        { key: 'spreadTime', label: 'Haas Time Shift', min: 'dynamic', max: 'dynamic', step: 'dynamic', isLog: false, unit: 'Sec' },
        { key: 'spreadLoudness', label: 'Spread Voice Gain', min: 0, max: 2, step: 0.01, isLog: false, unit: 'Vol' },
        { key: 'spreadMode', label: 'Voice Density', min: 0, max: 1, step: 1, isLog: false, unit: 'Vcs' }
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

    process(sample, baseT, s, fx, getWaveSample, waveType) {
        const mode = Math.round(fx.spreadMode);
        let subOscillationMix = 0;

        if (mode === 0) {
            let tOffset = baseT - fx.spreadTime;
            subOscillationMix = getWaveSample(waveType, 2 * Math.PI * s.frequency * tOffset, tOffset, s.frequency) * fx.spreadLoudness;
        } else {
            let tPlus = baseT - fx.spreadTime;
            let tMinus = baseT + fx.spreadTime;
            let v1 = getWaveSample(waveType, 2 * Math.PI * s.frequency * tPlus, tPlus, s.frequency);
            let v2 = getWaveSample(waveType, 2 * Math.PI * s.frequency * tMinus, tMinus, s.frequency);
            subOscillationMix = ((v1 + v2) / 2.0) * fx.spreadLoudness;
        }

        return (sample + subOscillationMix) / (1.0 + fx.spreadLoudness);
    }
};
