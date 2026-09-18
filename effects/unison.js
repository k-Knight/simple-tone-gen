window.Effect_Unison = {
    type: 'unison',
    label: 'Multi-Voice Unison Detune Modulator',
    theme: 'purple',

    knobs: [
        { key: 'superDetune', label: 'Detune Width', min: 0, max: 20, step: 0.01, isLog: false, unit: 'Hz' },
        { key: 'superLoudness', label: 'Unison Gain', min: 0, max: 2, step: 0.01, isLog: false, unit: 'Vol' },
        { key: 'superMode', label: 'Voice Phase', min: 0, max: 2, step: 1, isLog: false, unit: 'Mode', resetState: true }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, superDetune: 1.5, superLoudness: 0.75, superMode: 0 };
    },

    validate(fx) {
        fx.superDetune = parseFloat(Math.max(0, Math.min(1000, parseFloat(fx.superDetune) || 0)).toFixed(3));
        fx.superLoudness = parseFloat(Math.max(0, Math.min(2, parseFloat(fx.superLoudness) || 0)).toFixed(2));
        fx.superMode = Math.max(0, Math.min(2, Math.round(parseFloat(fx.superMode)) || 0));
    },

    process(ctx) {
        const { sample, baseT, smoothState, fx, getWaveSample, waveType } = ctx;
        
        const mode = Math.round(fx.superMode);
        let unisonMix = sample;

        const masterPhase = smoothState.phaseAccumulator;
        const detuneAngleOffset = 2 * Math.PI * fx.superDetune * baseT;

        if (mode === 0 || mode === 1) {
            let targetAngleUpper = masterPhase + detuneAngleOffset;
            unisonMix += getWaveSample(waveType, targetAngleUpper, smoothState.k, smoothState.pow) * fx.superLoudness;
        }
        if (mode === 0 || mode === 2) {
            let targetAngleLower = masterPhase - detuneAngleOffset;
            unisonMix += getWaveSample(waveType, targetAngleLower, smoothState.k, smoothState.pow) * fx.superLoudness;
        }

        return unisonMix / (1.0 + (mode === 0 ? 2 : 1) * fx.superLoudness);
    }
};
