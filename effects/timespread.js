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
        const { sample, baseT, smoothState, fx, getWaveSample, waveType } = ctx;

        const mode = Math.round(fx.spreadMode);
        let subOscillationMix = 0;

        const freq = smoothState.frequency > 0 ? smoothState.frequency : 200;

        const localTimeOffset = fx.periodOffset / freq;
        const baseAngle = smoothState.phaseAccumulator;
        const phaseRotationOffset = 2.0 * Math.PI * fx.periodOffset;

        if (mode === 0) {
            let rotatedAngle = baseAngle - phaseRotationOffset;
            let shiftedT = baseT + localTimeOffset; 

            subOscillationMix = getWaveSample(waveType, rotatedAngle, shiftedT, freq, smoothState.k, smoothState.pow) * fx.spreadLoudness;
        } else {
            let rotatedAnglePlus = baseAngle - phaseRotationOffset;
            let rotatedAngleMinus = baseAngle + phaseRotationOffset;
            
            let shiftedTPlus = baseT + localTimeOffset;
            let shiftedTMinus = baseT - localTimeOffset;

            let v1 = getWaveSample(waveType, rotatedAnglePlus, shiftedTPlus, freq, smoothState.k, smoothState.pow);
            let v2 = getWaveSample(waveType, rotatedAngleMinus, shiftedTMinus, freq, smoothState.k, smoothState.pow);
            subOscillationMix = ((v1 + v2) / 2.0) * fx.spreadLoudness;
        }

        return (sample + subOscillationMix) / (1.0 + fx.spreadLoudness);
    }
};
