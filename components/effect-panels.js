window.ComponentModule_EffectPanels = {
    render(gen, fx, appStateInstance) {
        const plugin = window.EffectRegistry.get(fx.type);
        if (!plugin) return null;

        const knobRenderer = window.ComponentModule_Knob.render;
        const icons = window.ResourceModule_Icons;

        return html`
            <div data-fx-id="${fx.id}" class="flex gap-4 p-4 bg-zinc-950/40 border border-${plugin.theme}-900/30 rounded-xl mt-2">
                
                <!-- FAR LEFT COLUMN: Themed Reordering Arrow Block Grid Layout -->
                <div class="flex flex-col gap-1.5 justify-center items-center bg-zinc-900/40 border border-zinc-800/30 p-1.5 rounded-lg select-none">
                    <button onClick=${() => appStateInstance.moveEffectTop(gen.id, fx.id)} class="flex items-center justify-center p-1 w-6 h-6 text-zinc-500 hover:text-${plugin.theme}-400 bg-zinc-950/40 hover:bg-${plugin.theme}-950/30 border border-zinc-800/60 hover:border-${plugin.theme}-800/50 rounded transition-all cursor-pointer" title="Move to Top">
                        ${icons.arrowTop}
                    </button>
                    <button onClick=${() => appStateInstance.moveEffectUp(gen.id, fx.id)} class="flex items-center justify-center p-1 w-6 h-6 text-zinc-500 hover:text-${plugin.theme}-400 bg-zinc-950/40 hover:bg-${plugin.theme}-950/30 border border-zinc-800/60 hover:border-${plugin.theme}-800/50 rounded transition-all cursor-pointer" title="Move Up">
                        ${icons.arrowUp}
                    </button>
                    <button onClick=${() => appStateInstance.moveEffectDown(gen.id, fx.id)} class="flex items-center justify-center p-1 w-6 h-6 text-zinc-500 hover:text-${plugin.theme}-400 bg-zinc-950/40 hover:bg-${plugin.theme}-950/30 border border-zinc-800/60 hover:border-${plugin.theme}-800/50 rounded transition-all cursor-pointer" title="Move Down">
                        ${icons.arrowDown}
                    </button>
                    <button onClick=${() => appStateInstance.moveEffectBottom(gen.id, fx.id)} class="flex items-center justify-center p-1 w-6 h-6 text-zinc-500 hover:text-${plugin.theme}-400 bg-zinc-950/40 hover:bg-${plugin.theme}-950/30 border border-zinc-800/60 hover:border-${plugin.theme}-800/50 rounded transition-all cursor-pointer" title="Move to Bottom">
                        ${icons.arrowBottom}
                    </button>
                </div>

                <!-- RIGHT SECTION: Main Panel Parameter Sliders Dashboard -->
                <div class="flex-grow space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-mono text-${plugin.theme}-400 font-bold uppercase tracking-wider">${plugin.label}</span>
                        <button onClick=${() => appStateInstance.removeEffect(gen.id, fx.id)} class="flex items-center justify-center p-1 w-7 h-7 text-zinc-500 hover:text-rose-400 bg-zinc-800/40 hover:bg-rose-800/40 border border-zinc-700/60 hover:border-rose-600 rounded-md transition-all cursor-pointer shadow-sm">
                            ${icons.remove}
                        </button>
                    </div>
                    <div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 justify-center">
                        ${plugin.knobs.map(k => {
                            return knobRenderer(
                                fx, 
                                k.key, 
                                k.label, 
                                k.min, 
                                k.max, 
                                k.step, 
                                k.isLog, 
                                k.unit, 
                                () => appStateInstance.sync(gen.id), 
                                plugin.theme
                            );
                        })}
                    </div>
                </div>
            </div>
        `;
    }
};
