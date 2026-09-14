window.ComponentModule_KnobController = {
    // --- 1. Mathematics ---
    getRotation(v, min, max, isLog) {
        let pct;
        if (isLog) {
            const safeMin = min <= 0 ? 0.001 : min;
            const safeV = v <= 0 ? safeMin : v;
            pct = (Math.log(safeV) - Math.log(safeMin)) / (Math.log(max) - Math.log(safeMin));
        } else {
            pct = (v - min) / (max - min);
        }
        pct = Math.max(0, Math.min(1, pct));
        return (pct * 270) - 135;
    },

    getDisplayPrecision(value, stepDecimals, isLog) {
        if (isLog) {
            const absCalc = Math.abs(value);
            if (absCalc >= 1000) return 0;
            if (absCalc > 100) return 1;
            if (absCalc > 10) return 2;
            return 3;
        }
        return stepDecimals;
    },

    calculateValueFromPct(pct, min, max, isLog) {
        if (isLog) {
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

    // --- 3. Interaction Mechanics / Event Binder ---
    bindInteractions(knobEl, targetObj, key, min, max, isLog, stepDecimals, syncCallback) {
        const dialSurface = any('.knob-dial-surface', knobEl);
        const inputNode = knobEl.querySelector('.knob-numeric-input');
        const resetBtn = any('.reset-knob-btn', knobEl);

        // --- Drag Engine Logic ---
        const setupDrag = (e) => {
            if (e.button === 2) return;
            let startY = e.pageY || (e.touches ? e.touches.pageY : e.pageY);
            let startVal = targetObj[key];
            
            let startPct;
            if (isLog) {
                const safeMin = min <= 0 ? 0.001 : min;
                const safeVal = startVal <= 0 ? safeMin : startVal;
                startPct = (Math.log(safeVal) - Math.log(safeMin)) / (Math.log(max) - Math.log(safeMin));
            } else {
                startPct = (startVal - min) / (max - min);
            }

            const move = (mev) => {
                let currentY = mev.pageY || (mev.touches ? mev.touches.pageY : mev.pageY);
                const sensitivity = mev.shiftKey ? 2000 : 200;
                let pctDelta = (startY - currentY) / sensitivity;
                let nextPct = Math.max(0, Math.min(1, startPct + pctDelta));

                let calculated = this.calculateValueFromPct(nextPct, min, max, isLog);
                let precision = this.getDisplayPrecision(calculated, stepDecimals, isLog);
                targetObj[key] = parseFloat(calculated.toFixed(precision));
                
                syncCallback();
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
            window.addEventListener('touchmove', move, { passive: false });
            window.addEventListener('touchend', stop);
        };

        // --- Reset Logic ---
        const handleReset = (e) => {
            if (e) e.preventDefault();
            targetObj[key] = targetObj._defaults && targetObj._defaults[key] !== undefined 
                ? targetObj._defaults[key] 
                : (min < 0 && max > 0 ? 0 : min);
            syncCallback();
            this.updateUIElements(knobEl, targetObj[key], key, min, max, isLog, stepDecimals);
        };

        // Attach Surreal Event Bindings
        dialSurface.on('mousedown', setupDrag);
        dialSurface.on('touchstart', setupDrag);
        dialSurface.on('contextmenu', handleReset);
        resetBtn.on('click', handleReset);

        // --- Direct Numeric Typing ---
        if (inputNode) {
            any(inputNode).on('keydown', e => { if (e.key === 'Enter') e.currentTarget.blur(); });
            any(inputNode).on('input', e => {
                let v = parseFloat(e.currentTarget.value) || min;
                targetObj[key] = Math.max(min, Math.min(max, v));
                syncCallback();
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
