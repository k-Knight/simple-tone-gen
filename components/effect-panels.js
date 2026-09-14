window.ComponentModule_EffectPanels = {
    render(gen, fx, appStateInstance) {
        const plugin = window.EffectRegistry.get(fx.type);
        if (!plugin) return null;

        const knobRenderer = window.ComponentModule_Knob.render;
        const icons = window.ResourceModule_Icons;

        const T = (gen.frequency > 0 ? (1.0 / gen.frequency) : 0.05) * 1.005;
        let dynamicStep = parseFloat((T / 1000).toFixed(7));
        if (dynamicStep <= 0) dynamicStep = 0.000001;

        return html`
            <div data-fx-id="${fx.id}" class="p-4 bg-zinc-950/40 border border-${plugin.theme}-900/30 rounded-xl space-y-3 mt-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-mono text-${plugin.theme}-400 font-bold uppercase tracking-wider">${plugin.label}</span>
                    <button onClick=${() => appStateInstance.removeEffect(gen.id, fx.id)} class="text-zinc-500 hover:text-rose-400 p-1 flex items-center justify-center hover:bg-zinc-800 rounded-md w-7 h-7 cursor-pointer">
                        ${icons.remove}
                    </button>
                </div>
                <!-- FIXED: Replaced grid-cols-1 sm:grid-cols-3 with an auto-fit minmax configuration -->
                <div class="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-3 justify-center">
                    ${plugin.knobs.map(k => {
                        const finalMin = k.min === 'dynamic' ? -T : k.min;
                        const finalMax = k.max === 'dynamic' ? T : k.max;
                        const finalStep = k.step === 'dynamic' ? dynamicStep : k.step;
                        
                        return knobRenderer(fx, k.key, k.label, finalMin, finalMax, finalStep, k.isLog, k.unit, () => appStateInstance.sync(gen.id), plugin.theme);
                    })}
                </div>
            </div>
        `;
    }
};
