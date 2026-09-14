window.EffectRegistry = {
    unison: window.Effect_Unison,
    timespread: window.Effect_TimeSpread,

    get(type) { return this[type] || null; }
};
