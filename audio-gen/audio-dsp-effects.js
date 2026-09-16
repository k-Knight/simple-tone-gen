window.AudioDspEffects = {
    processMultiVoiceEffects(engineState, gen, s, activeEffects, sharedPeriod, baseT, sampleRate, getWaveSample) {
        let currentSample = getWaveSample(gen.type, s.phaseAccumulator, baseT, s.frequency, s.k, s.pow);
        if (!activeEffects || activeEffects.length === 0) return currentSample;

        for (let j = 0; j < activeEffects.length; j++) {
            const fx = activeEffects[j];
            const plugin = window.EffectRegistry.get(fx.type);
            if (!plugin || !plugin.process) continue;

            this.ensureSmoothParams(s, fx);
            const smoothFxProxy = this.generateSmoothProxy(s, fx);

            currentSample = plugin.process({
                sample: currentSample,
                baseT: baseT,
                engineState: engineState,
                smoothState: s,
                fx: smoothFxProxy,
                sharedPeriod: sharedPeriod,
                sampleRate: sampleRate,
                getWaveSample: getWaveSample,
                waveType: gen.type
            });
        }
        return currentSample;
    },

    ensureSmoothParams(s, fx) {
        if (!s.fxPhases) s.fxPhases = {};
        if (!s.fxPhases[fx.id]) s.fxPhases[fx.id] = {};
        
        if (!s.fxSmoothParams) s.fxSmoothParams = {};
        if (!s.fxSmoothParams[fx.id]) {
            s.fxSmoothParams[fx.id] = { 
                p1: parseFloat(fx.superDetune ?? fx.spreadTime ?? fx.warpPeriod ?? 0), 
                p2: parseFloat(fx.superLoudness ?? fx.spreadLoudness ?? fx.zeroCutoff ?? 0),
                p3: parseFloat(fx.warpIntensity ?? fx.spreadMode ?? fx.superMode ?? 0)
            };
        }
    },

    generateSmoothProxy(s, fx) {
        const sm = s.fxSmoothParams[fx.id];
        const fXFactor = 0.005;

        const t1 = parseFloat(fx.superDetune ?? fx.spreadTime ?? fx.warpPeriod ?? 0);
        const t2 = parseFloat(fx.superLoudness ?? fx.spreadLoudness ?? fx.zeroCutoff ?? 0);
        const t3 = parseFloat(fx.warpIntensity ?? fx.spreadMode ?? fx.superMode ?? 0);

        sm.p1 += (t1 - sm.p1) * fXFactor;
        sm.p2 += (t2 - sm.p2) * fXFactor;
        sm.p3 += (t3 - sm.p3) * fXFactor;

        // Re-map structural fields safely
        return Object.assign({}, fx, {
            superDetune: sm.p1, spreadTime: sm.p1, warpPeriod: sm.p1,
            superLoudness: sm.p2, spreadLoudness: sm.p2, zeroCutoff: sm.p2,
            warpIntensity: sm.p3, spreadMode: sm.p3, superMode: sm.p3
        });
    }
};
