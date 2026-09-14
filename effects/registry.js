window.EffectRegistry = {
    unison: window.Effect_Unison,
    timespread: window.Effect_TimeSpread,
    hyperbolic: window.Effect_Hyperbolic,

    get(type) { return this[type] || null; }
};
