window.AudioDspEffects = {
    processMultiVoiceEffects(engineState, gen, s, activeEffects, sharedPeriod, baseT, sampleRate, getWaveSample) {
        // --- 1. Compute Base Core Sample ---
        let currentSample = getWaveSample(gen.type, s.phaseAccumulator, baseT, s.frequency, s.k, s.pow);

        // --- 2. Dynamic Composite Sub-Oscillators Stage (Isolated Wrapper) ---
        if (gen.subOscillators && gen.subOscillators.length > 0) {
            let combinedLeft = currentSample;

            // Initialize or reference tracked phase accumulators for sub-oscillators inside our smoothState map
            if (!s.subPhases) s.subPhases = {};

            for (let k = 0; k < gen.subOscillators.length; k++) {
                const sub = gen.subOscillators[k];
                if (sub.isMuted) continue;

                if (s.subPhases[sub.id] === undefined) {
                    s.subPhases[sub.id] = 0;
                }

                // Sub-Frequency calculation: Base frequency * sub multiplier
                const subFreq = s.frequency * sub.multiplier;

                // Advance phase safely sample-by-sample
                s.subPhases[sub.id] += (2 * Math.PI * subFreq) / sampleRate;
                s.subPhases[sub.id] %= (2 * Math.PI);

                const subTimeShift = baseT - sub.timeShift;
                let subSample = getWaveSample(sub.type, s.subPhases[sub.id], subTimeShift, subFreq, sub.k, sub.pow);

                if (sub.isInverted) {
                    subSample = -subSample;
                }

                // Balance mapping application for the mono summation branch
                // Pan/Gain logic follows standard generator math rules
                const subPanNormalized = (sub.pan + 1) / 2;
                const balanceGainFactor = Math.cos(subPanNormalized * Math.PI / 2) + Math.sin(subPanNormalized * Math.PI / 2);
                
                combinedLeft += subSample * sub.loudness * balanceGainFactor;
            }
            currentSample = combinedLeft;
        }

        // --- 3. Chain Subsequent Plugin Effects ---
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

        return Object.assign({}, fx, {
            superDetune: sm.p1, spreadTime: sm.p1, warpPeriod: sm.p1,
            superLoudness: sm.p2, spreadLoudness: sm.p2, zeroCutoff: sm.p2,
            warpIntensity: sm.p3, spreadMode: sm.p3, superMode: sm.p3
        });
    }
};
