window.Effect_DelayReverb = {
    type: 'delayReverb',
    label: 'Spatial Tape Echo & Delay',
    theme: 'indigo',
    knobs: [
        { key: 'time',      label: 'Delay Time',    min: 0.01, max: 1.0,  step: 0.01, isLog: false, unit: 'Sec' },
        { key: 'feedback',  label: 'Feedback',      min: 0.0,  max: 0.95, step: 0.01, isLog: false, unit: 'Fdbk' },
        { key: 'dampen',    label: 'Space Damp',    min: 0.0,  max: 0.9,  step: 0.01, isLog: false, unit: 'Damp' },
        { key: 'jitter',    label: 'Timing Jitter', min: 0.0,  max: 50.0, step: 0.1,  isLog: false, unit: 'Fltr' },
        { key: 'mix',       label: 'Dry/Wet Space', min: 0.0,  max: 1.0,  step: 0.01, isLog: false, unit: 'Mix' }
    ],

    getDefaults(fxId) {
        return { id: fxId, type: this.type, time: 0.30, feedback: 0.40, dampen: 0.30, jitter: 0.0, mix: 0.30 };
    },

    validate(g, fx) {
        fx.time = parseFloat(Math.max(0.01, Math.min(1.0, parseFloat(fx.time) || 0.30)).toFixed(2));
        fx.feedback = parseFloat(Math.max(0.0, Math.min(0.95, parseFloat(fx.feedback) || 0.40)).toFixed(2));
        fx.dampen = parseFloat(Math.max(0.0, Math.min(0.90, parseFloat(fx.dampen) || 0.30)).toFixed(2));
        fx.jitter = parseFloat(Math.max(0.0, Math.min(50.0, parseFloat(fx.jitter ?? 0.0))).toFixed(1));
        fx.mix = parseFloat(Math.max(0.0, Math.min(1.0, parseFloat(fx.mix ?? 0.30))).toFixed(2));
    },

    process(ctx) {
        const { sample, fx, engineState, sampleRate } = ctx;

        const time = fx.time;
        const feedback = fx.feedback;
        const dampen = fx.dampen;
        const jitter = fx.jitter;
        const mix = fx.mix;

        const stateId = fx.id;
        if (!engineState.delayBuffers) {
            engineState.delayBuffers = new Map();
        }

        if (!engineState.delayBuffers.has(stateId)) {
            engineState.delayBuffers.set(stateId, {
                buffer: new Float32Array(48000),
                writePtr: 0,
                lastOutput: 0,
                noisePhase: Math.random()
            });
        }

        const dState = engineState.delayBuffers.get(stateId);
        const dBuf = dState.buffer;

        dState.noisePhase += 0.007; 
        const microNoise = Math.sin(dState.noisePhase) * 0.4 + Math.sin(dState.noisePhase * 2.3) * 0.6;
        
        const targetDelaySamples = (time * sampleRate) + (microNoise * jitter);

        const exactDelaySamples = Math.max(1.0, Math.min(47998.0, targetDelaySamples));
        const baseOffsetIdx = Math.floor(exactDelaySamples);
        const fraction = exactDelaySamples - baseOffsetIdx;

        let readPtr1 = dState.writePtr - baseOffsetIdx;
        if (readPtr1 < 0) readPtr1 += 48000;
        
        let readPtr2 = readPtr1 - 1;
        if (readPtr2 < 0) readPtr2 += 48000;

        const sample1 = dBuf[readPtr1];
        const sample2 = dBuf[readPtr2];

        const delayedSample = sample1 + (sample2 - sample1) * fraction;

        dState.lastOutput = delayedSample + (dState.lastOutput - delayedSample) * dampen;

        dBuf[dState.writePtr] = sample + dState.lastOutput * feedback;
        dState.writePtr = (dState.writePtr + 1) % 48000;

        return sample * (1.0 - mix) + dState.lastOutput * mix;
    }
};
