window.AudioDspModule = {
    calculateBlock(engineState, bufferLength, leftChannel, rightChannel, sampleRate) {
        const getWaveSample = window.AudioWorker.getWaveSample;
        const utils = window.AudioDspUtils;
        const effects = window.AudioDspEffects;

        if (!engineState.visualBuffer) {
            engineState.visualBuffer = new Float32Array(800);
        }

        utils.initGlobalWarpTimeline(engineState);
        const targetPeriod = utils.getHyperbolicMasterPeriod(engineState.generators);

        for (let i = 0; i < bufferLength; i++) {
            let masterLeftSample = 0;
            let masterRightSample = 0;

            engineState.smoothWarpPeriod += (targetPeriod - engineState.smoothWarpPeriod) * 0.004;
            const sharedPeriod = engineState.smoothWarpPeriod;

            utils.advanceGlobalWarpPhase(engineState, sharedPeriod, sampleRate);

            for (let [genId, gen] of engineState.generators) {
                if (gen.isMuted) continue;

                utils.initGeneratorSmoothingState(engineState, genId, gen);
                const s = engineState.smoothState.get(genId);
                
                s.frequency += (gen.frequency - s.frequency) * 0.002;
                s.loudness += (gen.loudness - s.loudness) * 0.002;
                s.pan += (gen.pan - s.pan) * 0.002;
                s.timeShift += (gen.timeShift - s.timeShift) * 0.002;

                if (s.loudness <= 0.0001) continue;

                s.phaseAccumulator += (2 * Math.PI * s.frequency) / sampleRate;
                s.phaseAccumulator %= (2 * Math.PI);

                const baseT = (engineState.phaseTimeline / sampleRate) - s.timeShift;

                let voiceSampleLeft = effects.processMultiVoiceEffects(
                    engineState, 
                    gen, 
                    s, 
                    gen.effects, 
                    sharedPeriod, 
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

            if (!engineState.scopeRingBuffer) {
                engineState.scopeRingBuffer = new Float32Array(2048);
                engineState.scopeRingWritePtr = 0;
            }

            engineState.scopeRingBuffer[engineState.scopeRingWritePtr] = masterLeftSample;
            engineState.scopeRingWritePtr = (engineState.scopeRingWritePtr + 1) % 2048;

            engineState.phaseTimeline++;
        }

        const lowestFreq = utils.getLowestActiveFrequency(engineState);

        let samplesPerPeriod = sampleRate / lowestFreq;

        const baselineHzAnchor = 256;
        if (lowestFreq > baselineHzAnchor) {
            const octavesPast = Math.ceil(Math.log2(lowestFreq / baselineHzAnchor));
            samplesPerPeriod = samplesPerPeriod * Math.pow(2, octavesPast);
        }

        const totalDisplaySamples = samplesPerPeriod * 2.0;
        const bufferTime = bufferLength * (1.0/sampleRate);
        const carryOverTime = engineState.carryOverTime || 0;
        const triggerStartOffset = bufferLength * (carryOverTime / bufferTime);

        for (let v = 0; v < 800; v++) {
            const fraction = v / 799;
            
            const targetSampleOffset = triggerStartOffset + (fraction * totalDisplaySamples);
            
            const sampleIdx1 = Math.max(0, Math.min(bufferLength - 1, Math.floor(targetSampleOffset)));
            const sampleIdx2 = Math.max(0, Math.min(bufferLength - 1, sampleIdx1 + 1));
            
            const interpFactor = targetSampleOffset - sampleIdx1;

            const s1 = leftChannel[sampleIdx1];
            const s2 = leftChannel[sampleIdx2];

            engineState.visualBuffer[v] = s1 + (s2 - s1) * interpFactor;
        }

        const bufferRemainingTime = bufferTime - carryOverTime;
        const periodTime = (1.0/lowestFreq);
        const periodsInBuffer = bufferRemainingTime / periodTime;
        const carryOverPeriodPart = Math.ceil(periodsInBuffer) - periodsInBuffer;
        let carryOverTimeNew = carryOverPeriodPart * periodTime;

        if (carryOverTimeNew > periodTime) carryOverTimeNew -= periodTime;

        engineState.carryOverTime = carryOverTimeNew;
    }
};
