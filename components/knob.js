window.ComponentModule_Knob = {
    render(targetObj, key, label, min, max, step, isLog, unit, syncCallback, appStateInstance, customColor = 'cyan') {
        const icons = window.ResourceModule_Icons;

        const getRotation = () => {
            let v = targetObj[key], pct;
            if (key === 'superDetune') {
                pct = v <= 1.5 ? (v / 1.5) * 0.5 : 0.5 + ((v - 1.5) / (20 - 1.5)) * 0.5;
                pct = Math.max(0, Math.min(1, pct));
            } else if (isLog) {
                pct = (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
            } else {
                pct = (v - min) / (max - min);
            }
            return (pct * 270) - 135;
        };

        const setupDrag = (e) => {
            if (e.button === 2) return;
            let startY = e.pageY || e.touches.pageY;
            let startVal = targetObj[key];
            let startPct = key === 'superDetune'
                ? (startVal <= 1.5 ? (startVal / 1.5) * 0.5 : 0.5 + ((startVal - 1.5) / (20 - 1.5)) * 0.5)
                : (isLog ? (Math.log(startVal) - Math.log(min)) / (Math.log(max) - Math.log(min)) : (startVal - min) / (max - min));

            const containerNode = e.currentTarget.closest('.knob-container-block');
            const pointerNode = containerNode.querySelector('.dial-pointer');
            const inputNode = containerNode.querySelector('.knob-numeric-input');

            const move = (me) => {
                let currentY = me.pageY || (me.touches ? me.touches.pageY : startY);
                let pctDelta = (startY - currentY) / 200;
                let nextPct = Math.max(0, Math.min(1, startPct + pctDelta));

                if (key === 'superDetune') {
                    targetObj[key] = nextPct <= 0.5 ? parseFloat(((nextPct / 0.5) * 1.5).toFixed(4)) : parseFloat((1.5 + ((nextPct - 0.5) / 0.5) * (20 - 1.5)).toFixed(4));
                } else if (isLog) {
                    targetObj[key] = Math.round(Math.exp(Math.log(min) + nextPct * (Math.log(max) - Math.log(min))));
                } else {
                    targetObj[key] = parseFloat((min + (nextPct * (max - min))).toFixed(4));
                }
                
                syncCallback();
                
                if (pointerNode) pointerNode.style.transform = `rotate(${getRotation()}deg)`;
                if (inputNode) inputNode.value = targetObj[key];
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

        const reset = (e) => {
            if (e) e.preventDefault();
            targetObj[key] = targetObj._defaults && targetObj._defaults[key] !== undefined ? targetObj._defaults[key] : min;
            syncCallback();
            
            const containerNode = e.currentTarget.closest('.knob-container-block');
            if (containerNode) {
                const pointerNode = containerNode.querySelector('.dial-pointer');
                const inputNode = containerNode.querySelector('.knob-numeric-input');
                if (pointerNode) pointerNode.style.transform = `rotate(${getRotation()}deg)`;
                if (inputNode) inputNode.value = targetObj[key];
            }
        };

        const isSuperMode = key === 'superMode';
        const isEffect = targetObj.type === 'super' || customColor === 'purple';
        
        const colorClass = isEffect ? 'text-purple-400 focus:border-purple-500/50 knob-numeric-input' : 'text-cyan-400 focus:border-cyan-500/50 knob-numeric-input';
        const pointerColorClass = isEffect ? 'bg-purple-400' : 'bg-cyan-400';
        const resetHoverColorClass = isEffect ? 'hover:text-purple-400' : 'hover:text-cyan-400';
        const accentBg = isEffect ? 'bg-zinc-950/40' : 'bg-zinc-950/20';

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
                    <div class="w-full text-center text-[10px] text-purple-300 font-bold font-mono mt-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded select-none uppercase">
                        ${Math.round(targetObj[key]) === 0 ? 'Both' : (Math.round(targetObj[key]) === 1 ? 'Above' : 'Below')}
                    </div>
                ` : html`
                    <input type="number" min="${min}" max="${max}" step="${step}" value="${targetObj[key]}"
                           onKeydown=${e => { if(e.key==='Enter') e.currentTarget.blur(); }}
                           onInput=${e => { 
                               targetObj[key] = parseFloat(e.currentTarget.value) || min; 
                               syncCallback(); 
                               const ptr = e.currentTarget.closest('.knob-container-block').querySelector('.dial-pointer');
                               if (ptr) ptr.style.transform = `rotate(${getRotation()}deg)`;
                           }}
                           onBlur=${e => { isEffect ? appStateInstance.validateFxAndSync(appStateInstance.generators.find(g=>g.effects.includes(targetObj)), targetObj) : appStateInstance.validateAndSync(targetObj); }}
                           class="w-full mt-2 bg-zinc-900 border border-zinc-800 text-center font-mono text-xs py-0.5 rounded ${colorClass} focus:outline-none" />
                `}
            </div>
        `;
    }
};
