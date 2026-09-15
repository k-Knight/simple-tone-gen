window.AudioDspModule = {
    calculateBlock(engineState, bufferLength, leftChannel, rightChannel, sampleRate) {
        const getWaveSample = window.AudioWorker.getWaveSample;
        const utils = window.AudioDspUtils;
        const effects = window.AudioDspEffects;

        if (!engineState.visualBuffer) {
            engineState.visualBuffer = new Float32Array(800);
        }

        utils.initGlobalWarpTimeline(engineState);
        
        const lowestFreq = utils.getLowestActiveFrequency(engineState.generators);
        const targetPeriod = utils.getHyperbolicMasterPeriod(engineState.generators);
        
        const samplesPerPeriod = sampleRate / lowestFreq;
        const totalDisplaySamples = Math.round(samplesPerPeriod * 2);

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

                // FIXED: Forwarded engineState into the method call arguments below
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

            const currentPositionInCycle = engineState.phaseTimeline % totalDisplaySamples;
            const visualIndex = Math.floor((currentPositionInCycle / totalDisplaySamples) * 800);
            if (visualIndex >= 0 && visualIndex < 800) {
                engineState.visualBuffer[visualIndex] = masterLeftSample;
            }

            engineState.phaseTimeline++;
        }
    }
};
