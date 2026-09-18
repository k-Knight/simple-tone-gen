window.Effect_Hyperbolic = {
    type: 'hyperbolic',
    label: 'Hyperbolic Wave-Warp Modulator',
    theme: 'rose',
    knobs: [
        { key: 'warpPeriod', label: 'Warp Period Time', min: 0.00001, max: 5.0, step: 0.00001, isLog: true, unit: 'Sec' },
        { key: 'zeroCutoff', label: 'Zero Chaos Cutoff', min: 0.00000, max: 0.5, step: 0.00001, isLog: true, unit: 'Cut' },
        { key: 'warpIntensity', label: 'Modulation Depth', min: 0.0, max: 1.0, step: 0.01, isLog: false, unit: 'Mix' },
        { key: 'startMode', label: 'Start Phase Zone', min: 0, max: 1, step: 1, isLog: false, unit: 'Mode', resetState: true }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, warpPeriod: 0.15, zeroCutoff: 0.030, warpIntensity: 0.75, startMode: 0 };
    },

    validate(fx) {
        fx.warpPeriod = parseFloat(Math.max(0.01, Math.min(10.0, parseFloat(fx.warpPeriod) || 0.15)).toFixed(3));
        fx.zeroCutoff = parseFloat(Math.max(0.001, Math.min(0.5, parseFloat(fx.zeroCutoff) || 0.030)).toFixed(4));
        fx.warpIntensity = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.warpIntensity ?? 0.75))).toFixed(2));
        fx.startMode = Math.max(0, Math.min(1, Math.round(parseFloat(fx.startMode)) || 0));
    },

    process(ctx) {
        const { sample, baseT, engineState, smoothState, fx, getWaveSample, waveType, sampleRate } = ctx;

        const period = fx.warpPeriod;
        const cutoff = fx.zeroCutoff;
        const intensity = fx.warpIntensity;
        const startMode = Math.round(fx.startMode);

        const state = engineState.fxState[fx.id];

        if (state.localWarpPhase === undefined) {
            if (startMode === 1) {
                state.localWarpPhase = period;
                state.localWarpDirection = -1;
            } else {
                state.localWarpPhase = 0;
                state.localWarpDirection = 1;
            }
        }

        if (period > 0.0001) {
            state.localWarpPhase += state.localWarpDirection * (1.0 / sampleRate);
            if (state.localWarpPhase >= period) {
                state.localWarpPhase = period;
                state.localWarpDirection = -1;
            } else if (state.localWarpPhase <= 0) {
                state.localWarpPhase = 0;
                state.localWarpDirection = 1;
            }
        }

        let localT = state.localWarpPhase;
        if (localT < cutoff) localT = cutoff;

        let rawWarpedT = (period * cutoff) / localT;
        let warpedT = rawWarpedT * intensity + baseT * (1.0 - intensity);

        if (!state.lastWarpedT || state.lastWarpedT === 0) {
            state.accumulatedAngle = 2 * Math.PI * smoothState.frequency * warpedT;
            state.lastWarpedT = warpedT;
        }

        let deltaWarpedT = warpedT - state.lastWarpedT;

        if (Math.abs(deltaWarpedT) > 0.1) {
            deltaWarpedT = 0;
        }

        state.accumulatedAngle += 2.0 * Math.PI * smoothState.frequency * deltaWarpedT;
        state.accumulatedAngle = ((state.accumulatedAngle % (2.0 * Math.PI)) + (2.0 * Math.PI)) % (2.0 * Math.PI);
        state.lastWarpedT = warpedT;

        const warpedSample = getWaveSample(waveType, state.accumulatedAngle, smoothState.k, smoothState.pow);
        return sample * (1.0 - intensity) + warpedSample * intensity;
    }
};

