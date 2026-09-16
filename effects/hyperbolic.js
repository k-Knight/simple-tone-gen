window.Effect_Hyperbolic = {
    type: 'hyperbolic',
    label: 'Hyperbolic Wave-Warp Modulator',
    theme: 'rose',
    knobs: [
        { key: 'warpPeriod', label: 'Warp Period Time', min: 0.00001, max: 5.0, step: 0.00001, isLog: true, unit: 'Sec' },
        { key: 'zeroCutoff', label: 'Zero Chaos Cutoff', min: 0.00000, max: 0.5, step: 0.00001, isLog: true, unit: 'Cut' },
        { key: 'warpIntensity', label: 'Modulation Depth', min: 0.0, max: 1.0, step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, warpPeriod: 0.15, zeroCutoff: 0.030, warpIntensity: 0.75 };
    },

    validate(fx) {
        fx.warpPeriod = parseFloat(Math.max(0.01, Math.min(10.0, parseFloat(fx.warpPeriod) || 0.15)).toFixed(3));
        fx.zeroCutoff = parseFloat(Math.max(0.001, Math.min(0.5, parseFloat(fx.zeroCutoff) || 0.030)).toFixed(4));
        fx.warpIntensity = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.warpIntensity ?? 0.75))).toFixed(2));
    },

    process(ctx) {
        // Extract everything cleanly from the unified lifecycle context parameter object
        const { sample, baseT, engineState, smoothState, fx, sharedPeriod, getWaveSample, waveType } = ctx;

        const period = fx.warpPeriod;
        const cutoff = fx.zeroCutoff;
        const intensity = fx.warpIntensity;

        // Perform internal localized global phase timeline mutations
        let localT = engineState.globalWarpPhase ?? 0;
        if (localT < cutoff) localT = cutoff;

        // Calculate hyperbolic target times
        let rawWarpedT = (sharedPeriod * cutoff) / localT;
        let warpedT = rawWarpedT * intensity + baseT * (1.0 - intensity);
        let targetAngle = 2 * Math.PI * smoothState.frequency * warpedT;

        // Generate the replacement warped asset sample point directly here
        const warpedSample = getWaveSample(waveType, targetAngle, warpedT, smoothState.frequency, smoothState.k, smoothState.pow);

        // Return cross-faded blend mix based strictly on depth controls
        return sample * (1.0 - intensity) + warpedSample * intensity;
    }
};
