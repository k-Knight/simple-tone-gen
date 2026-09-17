window.EffectRegistry = {
    unison: window.Effect_Unison,
    timespread: window.Effect_TimeSpread,
    hyperbolic: window.Effect_Hyperbolic,
    overdrive: window.Effect_Overdrive,
    distortion: window.Effect_Distortion,
    fuzz: window.Effect_Fuzz,
    delayReverb: window.Effect_DelayReverb,

    get(type) { return this[type] || null; }
};
