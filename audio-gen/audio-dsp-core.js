
window.AudioDspModule = {
    calculateBlock(engineState, bufferLength, leftChannel, rightChannel, sampleRate) {
        const getWaveSample = window.AudioWorker.getWaveSample;
        const utils = window.AudioDspUtils;
        const effects = window.AudioDspEffects;

        if (!engineState.visualBuffer) {
            engineState.visualBuffer = new Float32Array(VISUAL_POINTS);
        }

        if (!engineState.scopeRingBuffer) {
            engineState.scopeRingBuffer = new Float32Array(MAX_SCOPE_RING_BUFFER);
            engineState.scopeRingWritePtr = 0;
            engineState.lastPeriodIndex = 0;
            engineState.phaseTracker = 0;
        }

        const lowestFreq = utils.getLowestActiveFrequency(engineState) || DEFAULT_FALLBACK_FREQ;
        let samplesPerPeriod = sampleRate / lowestFreq;

        const scaleStartHz = 500;
        const scaleEndHz = SCALE_END_HZ;

        if (lowestFreq > scaleStartHz) {
            const logRatio = Math.log(lowestFreq / scaleStartHz) / Math.log(scaleEndHz / scaleStartHz);
            const t = Math.max(0, Math.min(1.0, logRatio));
            const reductionFactor = 1.0 / Math.pow(0.125, t);

            samplesPerPeriod = samplesPerPeriod * reductionFactor;
        }

        for (let i = 0; i < bufferLength; i++) {
            let masterLeftSample = 0;
            let masterRightSample = 0;

            for (let [genId, gen] of engineState.generators) {
                if (gen.isMuted) continue;

                utils.initGeneratorSmoothingState(engineState, genId, gen);
                const s = engineState.smoothState.get(genId);

                s.frequency += (gen.frequency - s.frequency) * ADJUSTMENT_RATE;
                s.loudness += (gen.loudness - s.loudness) * ADJUSTMENT_RATE;
                s.pan += (gen.pan - s.pan) * ADJUSTMENT_RATE;
                s.timeShift += (gen.timeShift - s.timeShift) * ADJUSTMENT_RATE;

                if (gen.mustSnapK) {
                    s.k = gen.k;
                    gen.mustSnapK = false;
                } else {
                    s.k += (gen.k - s.k) * ADJUSTMENT_RATE;
                }
                s.pow += (gen.pow - s.pow) * ADJUSTMENT_RATE;

                if (s.loudness <= 0.0001) continue;

                const freq = s.frequency > 0 ? s.frequency : DEFAULT_FALLBACK_FREQ;
                s.phaseAccumulator += (TWO_PI * freq) / sampleRate;
                s.phaseAccumulator %= TWO_PI;

                const compositeWaveSampleClosure = (type, targetInputAngle, kParam, powParam) => {
                    let compositeResult = getWaveSample(type, targetInputAngle, kParam, powParam, gen.wavetableData);

                    if (gen.subOscillators && gen.subOscillators.length > 0) {
                        if (!s.subPhases) s.subPhases = {};
                        if (!s.smoothSubTimeShifts) s.smoothSubTimeShifts = {};

                        const basePhaseAngleOffset = (s.smoothTimeShift ?? gen.timeShift) * TWO_PI;
                        const baselinePhaseAccumulatorReference = targetInputAngle - basePhaseAngleOffset;

                        for (let k = 0; k < gen.subOscillators.length; k++) {
                            const sub = gen.subOscillators[k];
                            if (sub.isMuted) continue;

                            const subFreq = freq * sub.multiplier;
                            let adjustedSubAngle = 0;

                            if (s.smoothSubTimeShifts[sub.id] === undefined) {
                                s.smoothSubTimeShifts[sub.id] = sub.timeShift;
                            }
                            s.smoothSubTimeShifts[sub.id] += (sub.timeShift - s.smoothSubTimeShifts[sub.id]) * PHASE_SMOOTH_FACTOR;

                            const subPhaseAngleOffset = s.smoothSubTimeShifts[sub.id] * TWO_PI;
                            const isIntegerHarmonic = sub.multiplier >= 1.0 && Number.isInteger(sub.multiplier);

                            if (isIntegerHarmonic) {
                                const derivedSubPhase = baselinePhaseAccumulatorReference * sub.multiplier;
                                adjustedSubAngle = derivedSubPhase + basePhaseAngleOffset + subPhaseAngleOffset;
                            } else {
                                if (s.subPhases[sub.id] === undefined) s.subPhases[sub.id] = 0;
                                
                                if (i === 0) {
                                    s.subPhases[sub.id] += (TWO_PI * subFreq) / sampleRate;
                                    s.subPhases[sub.id] %= TWO_PI;
                                }
                                adjustedSubAngle = s.subPhases[sub.id] + basePhaseAngleOffset + subPhaseAngleOffset;
                            }

                            let subSample = getWaveSample(sub.type, adjustedSubAngle, sub.k, sub.pow, sub.wavetableData);
                            if (sub.isInverted) subSample = -subSample;

                            const subPanNormalized = (sub.pan + 1) / 2;
                            const balanceGainFactor = Math.cos(subPanNormalized * Math.PI / 2) + Math.sin(subPanNormalized * Math.PI / 2);

                            compositeResult += subSample * sub.loudness * balanceGainFactor;
                        }
                    }

                    return compositeResult;
                };

                let voiceSampleLeft = effects.processMultiVoiceEffects(
                    engineState,
                    gen,
                    s,
                    gen.effects,
                    sampleRate,
                    compositeWaveSampleClosure
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

            engineState.scopeRingWritePtr = (ptr + 1) % MAX_SCOPE_RING_BUFFER;
            engineState.phaseTimeline++;
        }

        const periodsInVisBuffer = 2.0;
        const totalDisplaySamples = periodsInVisBuffer * samplesPerPeriod;
        const periodsToJumpBack = Math.ceil(periodsInVisBuffer);
        const startIdx = (engineState.lastPeriodIndex - ((periodsToJumpBack * samplesPerPeriod) | 0)) & (MAX_SCOPE_RING_BUFFER - 1);

        for (let v = 0; v < VISUAL_POINTS; v++) {
            const fraction = v / (VISUAL_POINTS - 1);
            const targetSampleOffset = fraction * totalDisplaySamples;

            const offset1 = Math.floor(targetSampleOffset);
            const offset2 = offset1 + 1;
            const interpFactor = targetSampleOffset - offset1;

            const ringIdx1 = (startIdx + offset1) % MAX_SCOPE_RING_BUFFER;
            const ringIdx2 = (startIdx + offset2) % MAX_SCOPE_RING_BUFFER;

            const s1 = engineState.scopeRingBuffer[ringIdx1];
            const s2 = engineState.scopeRingBuffer[ringIdx2];

            engineState.visualBuffer[v] = s1 + (s2 - s1) * interpFactor;
        }
    }
};
