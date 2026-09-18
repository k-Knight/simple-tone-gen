window.EffectRegistry = {
    unison: window.Effect_Unison,
    timespread: window.Effect_TimeSpread,
    hyperbolic: window.Effect_Hyperbolic,
    overdrive: window.Effect_Overdrive,
    distortion: window.Effect_Distortion,
    fuzz: window.Effect_Fuzz,
    delayReverb: window.Effect_DelayReverb,
    buzzsaw: window.Effect_Buzzsaw,
    cockedwah: window.Effect_CockedWah,
    bitcrusher: window.Effect_Bitcrusher,
    ringmod: window.Effect_RingMod,

    get(type) { return this[type] || null; }
};
