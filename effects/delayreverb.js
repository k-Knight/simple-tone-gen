window.Effect_DelayReverb = {
    type: 'delayReverb',
    label: 'Spatial Tape Echo & Delay',
    theme: 'indigo',
    knobs: [
        { key: 'time',     label: 'Delay Time',   min: 0.01, max: 1.0,  step: 0.01, isLog: false, unit: 'Sec' },
        { key: 'feedback', label: 'Feedback',     min: 0.0,  max: 0.95, step: 0.01, isLog: false, unit: 'Fdbk' },
        { key: 'dampen',   label: 'Space Damp',   min: 0.0,  max: 0.9,  step: 0.01, isLog: false, unit: 'Damp' },
        { key: 'mix',      label: 'Dry/Wet Space',min: 0.0,  max: 1.0,  step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, time: 0.30, feedback: 0.40, dampen: 0.30, mix: 0.30 };
    },

    validate(g, fx) {
        fx.time = parseFloat(Math.max(0.05, Math.min(1.0, parseFloat(fx.time) || 0.30)).toFixed(2));
        fx.feedback = parseFloat(Math.max(0.0, Math.min(0.95, parseFloat(fx.feedback) || 0.40)).toFixed(2));
        fx.dampen = parseFloat(Math.max(0.0, Math.min(0.90, parseFloat(fx.dampen) || 0.30)).toFixed(2));
        fx.mix = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.mix ?? 0.30))).toFixed(2));
    },

    process(ctx) {
        const { sample, fx, engineState, sampleRate } = ctx;

        const time = fx.time;
        const feedback = fx.feedback;
        const dampen = fx.dampen;
        const mix = fx.mix;

        const stateId = fx.id;
        if (!engineState.delayBuffers) {
            engineState.delayBuffers = new Map();
        }

        if (!engineState.delayBuffers.has(stateId)) {
            engineState.delayBuffers.set(stateId, {
                buffer: new Float32Array(48000),
                writePtr: 0,
                lastOutput: 0
            });
        }

        const dState = engineState.delayBuffers.get(stateId);
        const dBuf = dState.buffer;

        const delaySamples = Math.floor(time * sampleRate);
        let readPtr = dState.writePtr - delaySamples;
        if (readPtr < 0) readPtr += 48000;

        const delayedSample = dBuf[readPtr];
        dState.lastOutput = delayedSample + (dState.lastOutput - delayedSample) * dampen;

        dBuf[dState.writePtr] = sample + dState.lastOutput * feedback;
        dState.writePtr = (dState.writePtr + 1) % 48000;

        return sample * (1.0 - mix) + dState.lastOutput * mix;
    }
};
