window.AudioDspEffects = {
    processHyperbolicWarp(engineState, s, activeWarpers, sharedPeriod, baseT) {
        let warp = { targetAngle: s.phaseAccumulator, warpedT: baseT, isWarped: false, fx: null };
        
        if (activeWarpers.length > 0) {
            warp.fx = activeWarpers;
            
            if (!s.warpSmooth) {
                s.warpSmooth = { 
                    cutoff: parseFloat(warp.fx.zeroCutoff) || 0.030, 
                    intensity: parseFloat(warp.fx.warpIntensity) || 0.75 
                };
            }
            
            s.warpSmooth.cutoff += ((parseFloat(warp.fx.zeroCutoff) || 0.030) - s.warpSmooth.cutoff) * 0.004;
            s.warpSmooth.intensity += ((parseFloat(warp.fx.warpIntensity) || 0.75) - s.warpSmooth.intensity) * 0.004;

            let localT = engineState.globalWarpPhase;
            if (localT < s.warpSmooth.cutoff) localT = s.warpSmooth.cutoff;

            let rawWarpedT = (sharedPeriod * s.warpSmooth.cutoff) / localT;
            warp.warpedT = rawWarpedT * s.warpSmooth.intensity + baseT * (1.0 - s.warpSmooth.intensity);
            warp.targetAngle = 2 * Math.PI * s.frequency * warp.warpedT;
            warp.isWarped = true;
        }
        return warp;
    },

    processMultiVoiceEffects(engineState, gen, s, activeMultipliers, warp, sharedPeriod, baseT, sampleRate, getWaveSample) {
        let currentSample = getWaveSample(gen.type, warp.targetAngle, warp.warpedT, s.frequency);
        if (activeMultipliers.length === 0) return currentSample;

        const smoothWarpCutoff = s.warpSmooth ? s.warpSmooth.cutoff : 0.030;
        const smoothWarpIntensity = s.warpSmooth ? s.warpSmooth.intensity : 0.75;

        for (let j = 0; j < activeMultipliers.length; j++) {
            const fx = activeMultipliers[j];
            const plugin = (window.EffectRegistry && typeof window.EffectRegistry.get === 'function')
                ? window.EffectRegistry.get(fx.type)
                : null;
                
            if (!plugin || !plugin.process) continue;

            if (!s.fxPhases[fx.id]) {
                s.fxPhases[fx.id] = {}; 
                s.fxSmoothParams = s.fxSmoothParams || {};
                s.fxSmoothParams[fx.id] = { 
                    p1: parseFloat(fx.superDetune !== undefined ? fx.superDetune : (fx.spreadTime || 0)), 
                    p2: parseFloat(fx.superLoudness !== undefined ? fx.superLoudness : (fx.spreadLoudness || 0)) 
                };
            }
        
            const sm = s.fxSmoothParams[fx.id];
            const fXFactor = 0.005;
            if (fx.superDetune !== undefined) sm.p1 += (parseFloat(fx.superDetune) - sm.p1) * fXFactor;
            else if (fx.spreadTime !== undefined) sm.p1 += (parseFloat(fx.spreadTime) - sm.p1) * fXFactor;
            
            if (fx.superLoudness !== undefined) sm.p2 += (parseFloat(fx.superLoudness) - sm.p2) * fXFactor;
            else if (fx.spreadLoudness !== undefined) sm.p2 += (parseFloat(fx.spreadLoudness) - sm.p2) * fXFactor;
        
            const smoothFxProxy = Object.assign({}, fx, {
                superDetune: sm.p1, spreadTime: sm.p1, detune: sm.p1, timeOffset: sm.p1,
                superLoudness: sm.p2, spreadLoudness: sm.p2, spread: sm.p2
            });
        
            currentSample = plugin.process(currentSample, baseT, s, smoothFxProxy, (type, angle, subT, freq, voiceId) => {
                const subLabel = voiceId || "0";
                const voiceKey = "v_" + freq.toFixed(4) + "_" + subLabel;
                
                const standardUnshiftedAngle = 2 * Math.PI * freq * subT;
                const runtimePhaseShiftOffset = angle - standardUnshiftedAngle;

                // FIXED: Direct Phase Resynchronization matching the discrete control change.
                // If this sub-voice key hasn't been initialized yet, or if it was inactive,
                // we force its starting point to sync perfectly with the main oscillator's phase state.
                if (s.fxPhases[fx.id][voiceKey] === undefined) {
                    s.fxPhases[fx.id][voiceKey] = s.phaseAccumulator % (2 * Math.PI);
                }
                
                s.fxPhases[fx.id][voiceKey] += (2 * Math.PI * freq) / sampleRate;
                s.fxPhases[fx.id][voiceKey] %= (2 * Math.PI);
                
                let voiceAngle = s.fxPhases[fx.id][voiceKey] + runtimePhaseShiftOffset;
            
                if (warp.isWarped && warp.fx) {
                    let subLocalT = engineState.globalWarpPhase;
                    if (subLocalT < smoothWarpCutoff) subLocalT = smoothWarpCutoff;
                    let rawSubWarpedT = (sharedPeriod * smoothWarpCutoff) / subLocalT;
                    let finalSubWarpedT = rawSubWarpedT * smoothWarpIntensity + subT * (1.0 - smoothWarpIntensity);
                    return getWaveSample(type, 2 * Math.PI * freq * finalSubWarpedT, finalSubWarpedT, freq);
                }
                return getWaveSample(type, voiceAngle, subT, freq);
            }, gen.type);
        }
        return currentSample;
    }
};
