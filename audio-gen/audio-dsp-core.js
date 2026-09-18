const adjustmentRate = 0.01;

window.AudioDspModule = {
    calculateBlock(engineState, bufferLength, leftChannel, rightChannel, sampleRate) {
        const getWaveSample = window.AudioWorker.getWaveSample;
        const utils = window.AudioDspUtils;
        const effects = window.AudioDspEffects;

        if (!engineState.visualBuffer) {
            engineState.visualBuffer = new Float32Array(800);
        }

        if (!engineState.scopeRingBuffer) {
            engineState.scopeRingBuffer = new Float32Array(16384);
            engineState.scopeRingWritePtr = 0;
            engineState.lastPeriodIndex = 0;
            engineState.phaseTracker = 0;
        }

        const lowestFreq = utils.getLowestActiveFrequency(engineState) || 200;
        let samplesPerPeriod = sampleRate / lowestFreq;

        const scaleStartHz = 500;
        const scaleEndHz = 20000;

        if (lowestFreq > scaleStartHz) {
            const logRatio = Math.log(lowestFreq / scaleStartHz) / Math.log(scaleEndHz / scaleStartHz);
            const t = Math.max(0, Math.min(1.0, logRatio));

            const reductionFactor = Math.pow(0.125, t);

            samplesPerPeriod = samplesPerPeriod * reductionFactor;
        }

        for (let i = 0; i < bufferLength; i++) {
            let masterLeftSample = 0;
            let masterRightSample = 0;

            for (let [genId, gen] of engineState.generators) {
                if (gen.isMuted) continue;

                utils.initGeneratorSmoothingState(engineState, genId, gen);
                const s = engineState.smoothState.get(genId);

                s.frequency += (gen.frequency - s.frequency) * adjustmentRate;
                s.loudness += (gen.loudness - s.loudness) * adjustmentRate;
                s.pan += (gen.pan - s.pan) * adjustmentRate;
                s.timeShift += (gen.timeShift - s.timeShift) * adjustmentRate;

                if (gen.mustSnapK) {
                    s.k = gen.k;
                    gen.mustSnapK = false;
                } else {
                    s.k += (gen.k - s.k) * adjustmentRate;
                }
                s.pow += (gen.pow - s.pow) * adjustmentRate;

                if (s.loudness <= 0.0001) continue;

                s.phaseAccumulator += (2 * Math.PI * s.frequency) / sampleRate;
                s.phaseAccumulator %= (2 * Math.PI);

                const baseT = (engineState.phaseTimeline / sampleRate) - s.timeShift;

                let voiceSampleLeft = effects.processMultiVoiceEffects(
                    engineState,
                    gen,
                    s,
                    gen.effects,
                    sampleRate,
                    baseT,
                    sampleRate,
                    getWaveSample
                );

                if (gen.isInverted) {
                    voiceSampleLeft = -voiceSampleLeft;
                }

                const panNormalized = (s.pan + 1) / 2;
                masterLeftSample += voiceSampleLeft * s.loudness * Math.cos(panNormalized * Math.PI / 2);
                masterRightSample += voiceSampleLeft * s.loudness * Math.sin(panNormalized * Math.PI / 2);
            }

            leftChannel[i] = masterLeftSample;
            rightChannel[i] = masterRightSample;

            const ptr = engineState.scopeRingWritePtr;
            engineState.scopeRingBuffer[ptr] = masterLeftSample;

            engineState.phaseTracker += (2 * Math.PI * lowestFreq) / sampleRate;
            if (engineState.phaseTracker >= 2 * Math.PI) {
                engineState.phaseTracker %= (2 * Math.PI);
                engineState.lastPeriodIndex = ptr;
            }

            engineState.scopeRingWritePtr = (ptr + 1) % 16384;
            engineState.phaseTimeline++;
        }

        const periodsInVisBuffer = 2.0;
        const totalDisplaySamples = periodsInVisBuffer * samplesPerPeriod;

        const periodsToJumpBack = Math.ceil(periodsInVisBuffer);
        let startIdx = engineState.lastPeriodIndex - Math.floor(periodsToJumpBack * samplesPerPeriod);

        if (startIdx < 0) {
            startIdx = 16384 + (startIdx % 16384);
        }

        for (let v = 0; v < 800; v++) {
            const fraction = v / 799;
            const targetSampleOffset = fraction * totalDisplaySamples;

            const offset1 = Math.floor(targetSampleOffset);
            const offset2 = offset1 + 1;
            const interpFactor = targetSampleOffset - offset1;

            const ringIdx1 = (startIdx + offset1) % 16384;
            const ringIdx2 = (startIdx + offset2) % 16384;

            const s1 = engineState.scopeRingBuffer[ringIdx1];
            const s2 = engineState.scopeRingBuffer[ringIdx2];

            engineState.visualBuffer[v] = s1 + (s2 - s1) * interpFactor;
        }
    }
};
