window.ComponentModule_KnobController = {
    updateUIElements(knobEl, val, key, min, max, isLog, stepDecimals) {
        const math = window.ComponentModule_KnobMath;
        const pointerNode = knobEl.querySelector('.dial-pointer');
        const inputNode = knobEl.querySelector('.knob-numeric-input');
        const textDisplayNode = knobEl.querySelector('.knob-text-display');

        const deg = math.getRotation(val, min, max, isLog);
        const prec = math.getDisplayPrecision(val, stepDecimals, isLog);

        if (pointerNode) pointerNode.style.transform = `rotate(${deg}deg)`;
        if (inputNode) inputNode.value = val.toFixed(prec);

        if (textDisplayNode) {
            const roundedMode = Math.round(val);
            if (key === 'spreadMode') {
                textDisplayNode.textContent = roundedMode === 0 ? '1 Voice' : '2 Voices';
            } else {
                textDisplayNode.textContent = roundedMode === 0 ? 'Both' : (roundedMode === 1 ? 'Above' : 'Below');
            }
        }
    },

    bindInteractions(knobEl, targetObj, key, min, max, step, isLog, stepDecimals, syncCallback) {
        const math = window.ComponentModule_KnobMath;
        const dialSurface = any('.knob-dial-surface', knobEl);
        const inputNode = knobEl.querySelector('.knob-numeric-input');
        const resetBtn = any('.reset-knob-btn', knobEl);

        const pluginSchema = (targetObj && targetObj.type && window.EffectRegistry && typeof window.EffectRegistry.get === 'function')
            ? window.EffectRegistry.get(targetObj.type)
            : null;

        const knobList = pluginSchema ? (pluginSchema.knobs || []) : [];
        const currentKnobSchema = knobList.find(k => k.key === key);
        const forcesSimulationReset = currentKnobSchema && currentKnobSchema.resetState === true;

        if (dialSurface && dialSurface.run) {
            dialSurface.run(el => { el.style.touchAction = 'none'; });
        }

        const setupDrag = (e) => {
            if (e.button === 2) return;

            const touchTarget = e.touches && e.touches.length > 0 ? e.touches[0] : e;
            let startX = touchTarget.pageX;
            let startY = touchTarget.pageY;
            let startVal = targetObj[key];

            let startPct;
            const range = max - min;

            if (isLog && Math.abs(range) > 0.00001) {
                const linearPct = (startVal - min) / range;
                const clampedLinearPct = Math.max(0, Math.min(1, linearPct));
                startPct = Math.log(clampedLinearPct * 0.5 + 1.0) / Math.log(1.5);
            } else {
                startPct = range !== 0 ? (startVal - min) / range : 0;
            }

            if (resetBtn) {
                const nativeBtn = resetBtn[0] || (resetBtn.el) || resetBtn;
                if (nativeBtn && nativeBtn.classList) {
                    nativeBtn.classList.add('pointer-events-none');
                }
            }

            let lastFrameX = startX;
            let lastFrameY = startY;

            let totalAccumulatedDeltaX = 0;
            let totalAccumulatedDeltaY = 0;

            const move = (mev) => {
                if (mev.cancelable) mev.preventDefault();

                const currentTouch = mev.touches && mev.touches.length > 0 ? mev.touches[0] : mev;
                let currentX = currentTouch.pageX;
                let currentY = currentTouch.pageY;

                let continuousDeltaX = currentX - lastFrameX;
                let continuousDeltaY = currentY - lastFrameY;

                lastFrameX = currentX;
                lastFrameY = currentY;

                totalAccumulatedDeltaX += Math.abs(continuousDeltaX);
                totalAccumulatedDeltaY += Math.abs(continuousDeltaY);

                const microMovementThreshold = 3.0;
                if (totalAccumulatedDeltaX < microMovementThreshold) continuousDeltaX = 0;
                if (totalAccumulatedDeltaY < microMovementThreshold) continuousDeltaY = 0;

                if (totalAccumulatedDeltaX > 0 || totalAccumulatedDeltaY > 0) {
                    if (totalAccumulatedDeltaX * 5.0 < totalAccumulatedDeltaY) {
                        continuousDeltaX = 0;
                    } else if (totalAccumulatedDeltaY * 5.0 < totalAccumulatedDeltaX) {
                        continuousDeltaY = 0; 
                    }
                }

                let correctedDeltaY = -continuousDeltaY;

                let dynamicSensitivityScale = 1.0;
                if (isLog) {
                    if (Math.abs(range) > 0.00001) {
                        const currentVal = targetObj[key];
                        const linearPct = (currentVal - min) / range;
                        const clampedPct = Math.max(0, Math.min(1, linearPct));
                        
                        dynamicSensitivityScale = 0.05 + 0.95 * Math.pow(clampedPct * 2, 0.67);
                    }
                }

                const coarseSensitivity = 300.0 / dynamicSensitivityScale;
                const fineSensitivity = 2500.0 / dynamicSensitivityScale;

                let pctDelta = (correctedDeltaY / coarseSensitivity) + (continuousDeltaX / fineSensitivity);
                
                startPct = Math.max(0, Math.min(1, startPct + pctDelta));

                let calculated = math.calculateValueFromPct(startPct, min, max, isLog);

                if (step && step > 0) {
                    const stepsCount = Math.round((calculated - min) / step);
                    calculated = min + (stepsCount * step);
                    calculated = Math.max(min, Math.min(max, calculated));
                }

                let precision = math.getDisplayPrecision(calculated, stepDecimals, isLog);
                const nextFinalValue = parseFloat(calculated.toFixed(precision));

                const previousValue = targetObj[key];
                targetObj[key] = nextFinalValue;

                if (typeof syncCallback === 'function') {
                    syncCallback();
                }

                const hasValueSubstantiallyChanged = Math.abs(nextFinalValue - previousValue) > 0.0001;

                if (forcesSimulationReset && hasValueSubstantiallyChanged && window.audio && typeof window.audio.restartSimulation === 'function') {
                    window.audio.restartSimulation();
                }

                this.updateUIElements(knobEl, targetObj[key], key, min, max, isLog, stepDecimals);
            };

            const stop = () => {
                if (resetBtn) {
                    const nativeBtn = resetBtn[0] || (resetBtn.el) || resetBtn;
                    if (nativeBtn && nativeBtn.classList) {
                        nativeBtn.classList.remove('pointer-events-none');
                    }
                }

                window.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', stop);
                window.removeEventListener('touchmove', move);
                window.removeEventListener('touchend', stop);
            };

            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', stop);
            window.addEventListener('touchmove', move, { passive: false });
            window.addEventListener('touchend', stop);
        };

        const handleReset = (e) => {
            if (e) e.preventDefault();
            const previousValue = targetObj[key];
            let nextFinalValue;
            
            if (key === 'k' && window.AppState && window.AppState.waveProfiles && window.AppState.waveProfiles[targetObj.type]) {
                nextFinalValue = window.AppState.waveProfiles[targetObj.type].default;
            } else {
                nextFinalValue = targetObj._defaults && targetObj._defaults[key] !== undefined
                    ? targetObj._defaults[key]
                    : (min < 0 && max > 0 ? 0 : min);
            }

            targetObj[key] = nextFinalValue;

            if (typeof syncCallback === 'function') {
                syncCallback();
                if (window.AppState && typeof window.AppState.sync === 'function') {
                    window.AppState.sync(targetObj.id);
                }
            }

            const hasValueSubstantiallyChanged = Math.abs(nextFinalValue - previousValue) > 0.0001;

            if (forcesSimulationReset && hasValueSubstantiallyChanged && window.audio && typeof window.audio.restartSimulation === 'function') {
                window.audio.restartSimulation();
            }

            this.updateUIElements(knobEl, targetObj[key], key, min, max, isLog, stepDecimals);
        };

        dialSurface.on('mousedown', setupDrag);
        dialSurface.on('touchstart', setupDrag);
        dialSurface.on('contextmenu', handleReset);
        resetBtn.on('click', handleReset);

        if (inputNode) {
            any(inputNode).on('keydown', e => { if (e.key === 'Enter') e.currentTarget.blur(); });
            any(inputNode).on('input', e => {
                let v = parseFloat(e.currentTarget.value) || min;
                const nextFinalValue = Math.max(min, Math.min(max, v));

                const previousValue = targetObj[key];
                targetObj[key] = nextFinalValue;

                if (typeof syncCallback === 'function') {
                    syncCallback();
                }

                const hasValueSubstantiallyChanged = Math.abs(nextFinalValue - previousValue) > 0.0001;

                if (forcesSimulationReset && hasValueSubstantiallyChanged && window.audio && typeof window.audio.restartSimulation === 'function') {
                    window.audio.restartSimulation();
                }

                this.updateUIElements(knobEl, targetObj[key], key, min, max, isLog, stepDecimals);
            });
            any(inputNode).on('blur', () => {
                if (targetObj.type === 'unison' || targetObj.type === 'timespread') {
                    const parentOscillator = window.AppState.generators.find(g =>
                        g.effects && g.effects.some(fx => fx.id === targetObj.id)
                    );
                    window.AppState.validateFxAndSync(parentOscillator, targetObj);
                } else {
                    window.AppState.validateAndSync(targetObj);
                }
                this.updateUIElements(knobEl, targetObj[key], key, min, max, isLog, stepDecimals);
            });
        }
    }
};
