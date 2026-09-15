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
                const { activeWarpers, activeMultipliers } = utils.categorizeEffects(gen.effects);

                const warp = effects.processHyperbolicWarp(engineState, s, activeWarpers, sharedPeriod, baseT);

                let voiceSampleLeft = effects.processMultiVoiceEffects(
                    engineState, gen, s, activeMultipliers, warp, sharedPeriod, baseT, sampleRate, getWaveSample
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
        const samplesPerPeriod = sampleRate / lowestFreq;
        const totalDisplaySamples = Math.round(samplesPerPeriod * 2);

        const ring = engineState.scopeRingBuffer;
        const writePtr = engineState.scopeRingWritePtr;

        let triggerIndex = (writePtr - totalDisplaySamples + 2048) % 2048;
        
        for (let j = 0; j < 512; j++) {
            let idx = (writePtr - totalDisplaySamples - j + 2048) % 2048;
            let idxNext = (idx + 1) % 2048;
            
            if (ring[idx] <= 0.0 && ring[idxNext] > 0.0) {
                triggerIndex = idxNext;
                break;
            }
        }

        for (let v = 0; v < 800; v++) {
            let fraction = v / 799;
            
            let targetSampleOffset = fraction * totalDisplaySamples;
            let baseIndexOffset = Math.floor(targetSampleOffset);
            let interpFactor = targetSampleOffset - baseIndexOffset;

            let sampleIdx1 = (triggerIndex + baseIndexOffset) % 2048;
            let sampleIdx2 = (sampleIdx1 + 1) % 2048;

            let s1 = ring[sampleIdx1];
            let s2 = ring[sampleIdx2];

            engineState.visualBuffer[v] = s1 + (s2 - s1) * interpFactor;
        }
    }
};
