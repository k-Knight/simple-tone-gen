window.ComponentModule_Knob = {
    render(targetObj, key, label, min, max, step, isLog, unit, syncCallback, appStateInstance, customColor = 'cyan') {
        const icons = window.ResourceModule_Icons;

        const stepStr = String(step);
        const stepParts = stepStr.split('.');
        const stepDecimals = stepParts.length > 1 ? stepParts[1].length : 0;

        const getRotation = () => {
            let v = targetObj[key];
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
        };

        const getDisplayPrecision = (value) => {
            if (isLog) {
                const absCalc = Math.abs(value);
                if (absCalc >= 1000) return 0;
                if (absCalc > 100) return 1;
                if (absCalc > 10) return 2;
                return 3;
            }
            return stepDecimals;
        };

        const setupDrag = (e) => {
            if (e.button === 2) return;
            let startY = e.pageY || e.touches.pageY;
            let startVal = targetObj[key];
            
            let startPct;
            if (isLog) {
                const safeMin = min <= 0 ? 0.001 : min;
                const safeVal = startVal <= 0 ? safeMin : startVal;
                startPct = (Math.log(safeVal) - Math.log(safeMin)) / (Math.log(max) - Math.log(safeMin));
            } else {
                startPct = (startVal - min) / (max - min);
            }

            const containerNode = e.currentTarget.closest('.knob-container-block');
            const pointerNode = containerNode.querySelector('.dial-pointer');
            const inputNode = containerNode.querySelector('.knob-numeric-input');
            const textDisplayNode = containerNode.querySelector('.knob-text-display');

            const move = (me) => {
                let currentY = me.pageY || (me.touches ? me.touches.pageY : startY);
                
                const sensitivityDenominator = me.shiftKey ? 2000 : 200;
                let pctDelta = (startY - currentY) / sensitivityDenominator;
                let nextPct = Math.max(0, Math.min(1, startPct + pctDelta));

                let precision = getDisplayPrecision(startVal);

                if (isLog) {
                    const safeMin = min <= 0 ? 0.001 : min;
                    let calculated = Math.exp(Math.log(safeMin) + nextPct * (Math.log(max) - Math.log(safeMin)));
                    precision = getDisplayPrecision(calculated);
                    targetObj[key] = parseFloat(calculated.toFixed(precision));
                } else {
                    let rawVal = min + (nextPct * (max - min));
                    targetObj[key] = parseFloat(rawVal.toFixed(precision));
                }
                
                syncCallback();
                
                if (pointerNode) pointerNode.style.transform = `rotate(${getRotation()}deg)`;
                if (inputNode) inputNode.value = targetObj[key].toFixed(precision);
                
                if (textDisplayNode) {
                    const roundedMode = Math.round(targetObj[key]);
                    if (key === 'spreadMode') {
                        textDisplayNode.textContent = roundedMode === 0 ? '1 Voice' : '2 Voices';
                    } else if (key === 'superMode') {
                        textDisplayNode.textContent = roundedMode === 0 ? 'Both' : (roundedMode === 1 ? 'Above' : 'Below');
                    }
                }
            };

            const stop = () => {
                window.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', stop);
                window.removeEventListener('touchmove', move);
                window.removeEventListener('touchend', stop);
                appStateInstance.render();
            };

            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', stop);
            window.addEventListener('touchmove', move, { passive: false });
            window.addEventListener('touchend', stop);
        };

        const reset = (e) => {
            if (e) e.preventDefault();
            if (targetObj._defaults && targetObj._defaults[key] !== undefined) {
                targetObj[key] = targetObj._defaults[key];
            } else {
                targetObj[key] = min < 0 && max > 0 ? 0 : min;
            }
            syncCallback();
            appStateInstance.render();
        };

        const isSuperMode = key === 'superMode' || key === 'spreadMode';
        
        const activeTheme = customColor === 'purple' ? 'purple' : 'cyan';

        const colorClass = activeTheme === 'purple' 
            ? 'text-purple-400 focus:border-purple-500/50 knob-numeric-input' 
            : 'text-cyan-400 focus:border-cyan-500/50 knob-numeric-input';
            
        const pointerColorClass = activeTheme === 'purple' ? 'bg-purple-400' : 'bg-cyan-400';
        const textLabelColorClass = activeTheme === 'purple' ? 'text-purple-300' : 'text-cyan-300';
        const resetHoverColorClass = activeTheme === 'purple' ? 'hover:text-purple-400' : 'hover:text-cyan-400';
        const accentBg = activeTheme === 'purple' ? 'bg-zinc-950/40' : 'bg-zinc-950/20';

        const initPrecision = getDisplayPrecision(targetObj[key]);

        return html`
            <div class="knob-container-block flex flex-col items-center p-3 ${accentBg} border border-zinc-800/40 rounded-xl relative group">
                <button onClick=${reset} title="Reset to default" class="absolute top-2 left-2 p-1 text-zinc-500 ${resetHoverColorClass} bg-zinc-900/50 hover:bg-zinc-800 rounded-md border border-zinc-800 transition-all opacity-40 group-hover:opacity-100 flex items-center justify-center cursor-pointer z-10 w-7 h-7">
                    ${icons.reset.cloneNode(true)}
                </button>
                <span class="text-xs text-zinc-400 font-medium mb-2 pl-4 self-stretch text-center select-none">${label}</span>
                <div onMousedown=${setupDrag} onContextmenu=${reset} onTouchstart=${setupDrag} class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center relative cursor-ns-resize shadow-inner select-none flex-shrink-0">
                    <div class="dial-pointer absolute w-0.5 h-2.5 ${pointerColorClass} rounded top-0.5 left-1/2 -translate-x-1/2 origin-[center_21px]" style="transform: rotate(${getRotation()}deg)"></div>
                    <span class="text-[9px] font-mono text-zinc-500 pointer-events-none">${unit}</span>
                </div>
                
                ${isSuperMode ? html`
                    <div class="knob-text-display w-full text-center text-[10px] ${textLabelColorClass} font-bold font-mono mt-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded select-none uppercase">
                        ${key === 'spreadMode' 
                            ? (Math.round(targetObj[key]) === 0 ? '1 Voice' : '2 Voices')
                            : (Math.round(targetObj[key]) === 0 ? 'Both' : (Math.round(targetObj[key]) === 1 ? 'Above' : 'Below'))
                        }
                    </div>
                ` : html`
                    <input type="number" min="${min}" max="${max}" step="${step}" value="${targetObj[key].toFixed(initPrecision)}"
                           onKeydown=${e => { if(e.key==='Enter') e.currentTarget.blur(); }}
                           onInput=${e => { 
                               targetObj[key] = parseFloat(parseFloat(e.currentTarget.value).toFixed(initPrecision)); 
                               syncCallback(); 
                               const ptr = e.currentTarget.closest('.knob-container-block').querySelector('.dial-pointer');
                               if (ptr) ptr.style.transform = `rotate(${getRotation()}deg)`;
                           }}
                           onBlur=${e => { 
                               if (targetObj.type === 'unison' || targetObj.type === 'timespread') {
                                   appStateInstance.validateFxAndSync(appStateInstance.generators.find(g => g.effects.includes(targetObj)), targetObj);
                               } else {
                                   appStateInstance.validateAndSync(targetObj);
                               }
                           }}
                           class="w-full mt-2 bg-zinc-900 border border-zinc-800 text-center font-mono text-xs py-0.5 rounded ${colorClass} focus:outline-none" />
                `}
            </div>
        `;
    }
};
