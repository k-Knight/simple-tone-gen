window.ComponentModule_KnobController = {
    // --- 1. Mathematics ---
    getRotation(v, min, max, isLog) {
        let pct;
        if (isLog && min > 0 && max > 0) {
            const safeMin = min;
            const safeV = Math.max(safeMin, v);
            pct = (Math.log(safeV) - Math.log(safeMin)) / (Math.log(max) - Math.log(safeMin));
        } else {
            pct = (v - min) / (max - min);
        }
        pct = Math.max(0, Math.min(1, pct));
        return (pct * 270) - 135;
    },

    getDisplayPrecision(value, stepDecimals, isLog) {
        if (isLog && value > 0) {
            const absCalc = Math.abs(value);
            if (absCalc >= 1000) return 0;
            if (absCalc > 100) return 1;
            if (absCalc > 10) return 2;
            return 3;
        }
        return stepDecimals;
    },

    calculateValueFromPct(pct, min, max, isLog) {
        if (isLog && min > 0 && max > 0) {
            const safeMin = min <= 0 ? 0.001 : min;
            return Math.exp(Math.log(safeMin) + pct * (Math.log(max) - Math.log(safeMin)));
        }
        return min + (pct * (max - min));
    },

    // --- 2. Live DOM Mutators ---
    updateUIElements(knobEl, val, key, min, max, isLog, stepDecimals) {
        const pointerNode = knobEl.querySelector('.dial-pointer');
        const inputNode = knobEl.querySelector('.knob-numeric-input');
        const textDisplayNode = knobEl.querySelector('.knob-text-display');

        const deg = this.getRotation(val, min, max, isLog);
        const prec = this.getDisplayPrecision(val, stepDecimals, isLog);

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

    // --- 3. Mobile-Optimized Interaction Mechanics ---
    bindInteractions(knobEl, targetObj, key, min, max, step, isLog, stepDecimals, syncCallback) {
        const dialSurface = any('.knob-dial-surface', knobEl);
        const inputNode = knobEl.querySelector('.knob-numeric-input');
        const resetBtn = any('.reset-knob-btn', knobEl);

        // MOBILE OPTIMIZATION: Enforce strict touch isolation style rules directly on the surface [1]
        if (dialSurface && dialSurface.run) {
            dialSurface.run(el => { el.style.touchAction = 'none'; }); [1]
        }

        const setupDrag = (e) => {
            if (e.button === 2) return;
            
            // Extract coordinates safely supporting both Mouse Events and native Multi-Touch lists [1]
            const touchTarget = e.touches && e.touches.length > 0 ? e.touches[0] : e; [1]
            let startX = touchTarget.pageX; [1]
            let startY = touchTarget.pageY; [1]
            let startVal = targetObj[key];
            
            let startPct;
            if (isLog && min > 0 && max > 0) {
                const safeMin = min <= 0 ? 0.001 : min;
                const safeVal = startVal <= 0 ? safeMin : startVal;
                startPct = (Math.log(safeVal) - Math.log(safeMin)) / (Math.log(max) - Math.log(safeMin));
            } else {
                startPct = (startVal - min) / (max - min);
            }

            const move = (mev) => {
                // Prevent mobile scroll snapping behavior entirely during active manipulation loops [1]
                if (mev.cancelable) mev.preventDefault(); [1]

                const currentTouch = mev.touches && mev.touches.length > 0 ? mev.touches[0] : mev; [1]
                let currentX = currentTouch.pageX; [1]
                let currentY = currentTouch.pageY; [1]
                
                let deltaX = currentX - startX;
                let deltaY = startY - currentY; 

                // Sensitivity constants tuned for touch gestures
                const coarseSensitivity = 300.0; 
                const fineSensitivity = 2500.0;  

                let pctDelta = (deltaY / coarseSensitivity) + (deltaX / fineSensitivity);
                let nextPct = Math.max(0, Math.min(1, startPct + pctDelta));

                let calculated = this.calculateValueFromPct(nextPct, min, max, isLog);
                
                if (step && step > 0) {
                    const stepsCount = Math.round((calculated - min) / step);
                    calculated = min + (stepsCount * step);
                    calculated = Math.max(min, Math.min(max, calculated));
                }

                let precision = this.getDisplayPrecision(calculated, stepDecimals, isLog);
                targetObj[key] = parseFloat(calculated.toFixed(precision));
                
                if (typeof syncCallback === 'function') {
                    syncCallback();
                }
                
                this.updateUIElements(knobEl, targetObj[key], key, min, max, isLog, stepDecimals);
            };

            const stop = () => {
                window.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', stop);
                window.removeEventListener('touchmove', move);
                window.removeEventListener('touchend', stop);
            };

            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', stop);
            // passive: false is mandatory to allow preventDefault() to un-trap mobile scroll gestures [1]
            window.addEventListener('touchmove', move, { passive: false }); [1]
            window.addEventListener('touchend', stop);
        };

        const handleReset = (e) => {
            if (e) e.preventDefault();
            targetObj[key] = targetObj._defaults && targetObj._defaults[key] !== undefined 
                ? targetObj._defaults[key] 
                : (min < 0 && max > 0 ? 0 : min);
            
            if (typeof syncCallback === 'function') {
                syncCallback();
            }
            
            this.updateUIElements(knobEl, targetObj[key], key, min, max, isLog, stepDecimals);
        };

        // Bind interactive triggers safely across desktop and mobile devices
        dialSurface.on('mousedown', setupDrag);
        dialSurface.on('touchstart', setupDrag); [1]
        dialSurface.on('contextmenu', handleReset);
        resetBtn.on('click', handleReset);

        if (inputNode) {
            any(inputNode).on('keydown', e => { if (e.key === 'Enter') e.currentTarget.blur(); });
            any(inputNode).on('input', e => {
                let v = parseFloat(e.currentTarget.value) || min;
                targetObj[key] = Math.max(min, Math.min(max, v));
                
                if (typeof syncCallback === 'function') {
                    syncCallback();
                }
                
                this.updateUIElements(knobEl, targetObj[key], key, min, max, isLog, stepDecimals);
            });
            any(inputNode).on('blur', () => {
                if (targetObj.type === 'unison' || targetObj.type === 'timespread') {
                    window.AppState.validateFxAndSync(window.AppState.generators.find(g => g.effects.includes(targetObj)), targetObj);
                } else {
                    window.AppState.validateAndSync(targetObj);
                }
                this.updateUIElements(knobEl, targetObj[key], key, min, max, isLog, stepDecimals);
            });
        }
    }
};
