window.Effect_Unison = {
    type: 'unison',
    label: 'Multi-Voice Unison Detune Modulator',
    theme: 'purple',
    
    // UI generation engine blueprint map
    knobs: [
        { key: 'superDetune', label: 'Detune Width', min: 0, max: 20, step: 0.01, isLog: false, unit: 'Hz' },
        { key: 'superLoudness', label: 'Unison Gain', min: 0, max: 2, step: 0.01, isLog: false, unit: 'Vol' },
        { key: 'superMode', label: 'Voice Phase', min: 0, max: 2, step: 1, isLog: false, unit: 'Mode' }
    ],

    // Default structural schema payload boundaries
    getDefaults(fxId) {
        return { id: fxId, type: this.type, superDetune: 1.5, superLoudness: 0.75, superMode: 0 };
    },

    validate(fx) {
        fx.superDetune = parseFloat(Math.max(0, Math.min(1000, parseFloat(fx.superDetune) || 0)).toFixed(3));
        fx.superLoudness = parseFloat(Math.max(0, Math.min(2, parseFloat(fx.superLoudness) || 0)).toFixed(2));
        fx.superMode = Math.max(0, Math.min(2, Math.round(parseFloat(fx.superMode)) || 0));
    },

    // Pure Mathematical DSP Core Engine Rule
    process(sample, baseT, s, fx, getWaveSample, waveType) {
        const mode = Math.round(fx.superMode);
        let unisonMix = sample;

        if (mode === 0 || mode === 1) {
            let fUpper = s.frequency + fx.superDetune;
            unisonMix += getWaveSample(waveType, 2 * Math.PI * fUpper * baseT, baseT, fUpper) * fx.superLoudness;
        }
        if (mode === 0 || mode === 2) {
            let fLower = s.frequency - fx.superDetune;
            unisonMix += getWaveSample(waveType, 2 * Math.PI * fLower * baseT, baseT, fLower) * fx.superLoudness;
        }
        
        return unisonMix / (1.0 + (mode === 0 ? 2 : 1) * fx.superLoudness);
    }
};
