window.ComponentModule_Knob = {
    render(targetObj, key, label, min, max, step, isLog, unit, syncCallback, customColor = 'cyan') {
        const icons = window.ResourceModule_Icons;
        const ctrl = window.ComponentModule_KnobController;

        const stepStr = String(step);
        const stepParts = stepStr.split('.');

        let stepDecimals = 0;
        if (stepStr.includes('e-')) {
            stepDecimals = parseInt(stepStr.split('e-')[1]) || 6;
        } else if (stepParts.length > 1) {
            stepDecimals = stepParts[1].length;
        }

        const isSuperMode = key === 'superMode' || key === 'spreadMode';

        const colorClass = `text-${customColor}-400`;
        const pointerColorClass = `bg-${customColor}-400`;
        const textLabelColorClass = `text-${customColor}-300`;
        const resetHoverColorClass = `hover:text-${customColor}-400`;
        const accentBg = `bg-zinc-950/20`;

        const initialValue = targetObj[key];

        const knobEl = html`
            <div class="knob-container-block flex flex-col items-center p-3 ${accentBg} border border-zinc-800/40 rounded-xl relative group w-full max-w-[180px] mx-auto">
                <button class="reset-knob-btn absolute top-1.5 left-1.5 p-0.5 text-zinc-500 ${resetHoverColorClass} bg-zinc-900/50 hover:bg-zinc-800 rounded border border-zinc-800 transition-all opacity-40 group-hover:opacity-100 flex items-center justify-center cursor-pointer z-10 w-5 h-5" title="Reset to default">
                    ${icons.reset}
                </button>
                <span class="text-xs text-zinc-400 font-medium mb-2 pl-5 pr-1 self-stretch text-center select-none truncate" title="${label}">${label}</span>

                <div class="knob-dial-surface w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center relative cursor-ns-resize shadow-inner select-none flex-shrink-0">
                    <div class="dial-pointer absolute w-0.5 h-2.5 ${pointerColorClass} rounded top-0.5 left-1/2 -translate-x-1/2 origin-[center_21px]"></div>
                    <span class="text-[9px] font-mono text-zinc-500 pointer-events-none">${unit}</span>
                </div>

                ${isSuperMode ? html`
                    <div class="knob-text-display w-full text-center text-[10px] ${textLabelColorClass} font-bold font-mono mt-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded select-none uppercase"></div>
                ` : html`
                    <input type="number" min="${min}" max="${max}" step="${step}" value="${initialValue}"
                           class="knob-numeric-input w-full mt-2 bg-zinc-900 border border-zinc-800 text-center font-mono text-xs py-0.5 rounded ${colorClass} focus:outline-none focus:border-zinc-700" />
                `}
            </div>
        `;

        ctrl.updateUIElements(knobEl, initialValue, key, min, max, isLog, stepDecimals);
        ctrl.bindInteractions(knobEl, targetObj, key, min, max, step, isLog, stepDecimals, syncCallback);

        return knobEl;
    }
};
