window.ComponentModule_Oscillator = {
    render(gen, index, appStateInstance) {
        const knob = window.ComponentModule_Knob.render;
        const icons = window.ResourceModule_Icons;
        const ctrl = window.ComponentModule_OscillatorController;

        const cardEl = html`
            <div data-osc-id="${gen.id}" class="oscillator-card-root space-y-3 bg-zinc-900/30 p-4 border border-zinc-800/60 rounded-2xl relative transition-all">
                <section class="p-6 bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-lg">
                    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
                        <div class="flex flex-wrap items-center gap-4">
                            <span class="text-xs font-mono px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">OSC #${index + 1}</span>
                            <div class="wave-type-selectors-container flex bg-zinc-950 p-1 border border-zinc-800 rounded-xl text-xs">
                                ${appStateInstance.waveTypes.map(w => html`
                                    <button data-wave="${w}" 
                                            data-active="${gen.type === w ? 'true' : 'false'}"
                                            class="wave-type-btn px-2.5 py-1 rounded-lg border border-transparent capitalize text-zinc-400 transition-all cursor-pointer data-[active=true]:bg-zinc-800 data-[active=true]:text-cyan-400 data-[active=true]:border-zinc-700">
                                        ${w}
                                    </button>
                                `)}
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 select-none">
                                <input type="checkbox" class="invert-checkbox sr-only" ${gen.isInverted ? 'checked' : ''} />
                                <div class="invert-toggle-visual w-7 h-4 bg-zinc-800 rounded-xl relative border border-zinc-700 transition-all flex items-center px-0.5 data-[active=true]:bg-cyan-950/40 data-[active=true]:border-cyan-500/50"
                                     data-active="${gen.isInverted ? 'true' : 'false'}">
                                    <div class="w-2.5 h-2.5 bg-zinc-400 rounded-full transition-all transform data-[active=true]:bg-cyan-400 data-[active=true]:translate-x-3"
                                         data-active="${gen.isInverted ? 'true' : 'false'}"></div>
                                </div>
                                <span>Invert Wave</span>
                            </label>
                            <button class="mute-toggle-btn px-2.5 py-1 text-xs border border-zinc-700/40 rounded-lg uppercase tracking-wider font-bold transition-all flex items-center gap-1 cursor-pointer bg-zinc-950/40 text-zinc-500 data-[active=true]:bg-rose-950/80 data-[active=true]:text-rose-400 data-[active=true]:border-rose-800/60"
                                data-active="${gen.isMuted ? 'true' : 'false'}">
                            <div class="mute-dot w-1.5 h-1.5 rounded-full bg-zinc-700 transition-all data-[active=true]:bg-rose-400 data-[active=true]:animate-pulse"
                                 data-active="${gen.isMuted ? 'true' : 'false'}"></div>
                            <span>Mute</span>
                        </button>
                        </div>
                        <button class="remove-osc-btn text-zinc-500 hover:text-rose-400 cursor-pointer p-1 flex items-center justify-center hover:bg-zinc-800 rounded-xl transition-all w-8 h-8 select-none" title="Remove Oscillator">
                            ${icons.remove}
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${knob(gen, 'frequency', 'Frequency', 20, 20000, 1, true, 'Hz', () => appStateInstance.sync(gen.id), 'cyan')}
                        ${knob(gen, 'loudness', 'Loudness', 0, 1, 0.01, false, '%', () => appStateInstance.sync(gen.id), 'cyan')}
                        ${knob(gen, 'pan', 'Balance', -1, 1, 0.01, false, 'Bal', () => appStateInstance.sync(gen.id), 'cyan')}
                        ${knob(gen, 'timeShift', 'Time Shift', 0, 0.05, 0.0001, false, 'Sec', () => appStateInstance.sync(gen.id), 'cyan')}
                    </div>

                    <div class="mt-4 pt-4 border-t border-zinc-800/50 space-y-3">
                       <div class="flex items-center gap-3">
                            ${Object.keys(window.EffectRegistry).map(key => {
                                if (typeof window.EffectRegistry[key] === 'function') return null;
                            
                                const fxDef = window.EffectRegistry[key];
                                const isAdded = gen.effects.some(f => f.type === key);
                            
                                return html`
                                    <button data-add-fx="${key}" 
                                            onClick=${() => appStateInstance.addEffect(gen.id, key)} 
                                            class="px-3 py-1.5 border rounded-xl text-xs font-bold uppercase transition-all tracking-wide cursor-pointer flex items-center gap-2 border-${fxDef.theme}-900 bg-${fxDef.theme}-950/30 hover:bg-${fxDef.theme}-900/40 text-${fxDef.theme}-400 ${isAdded ? 'hidden' : ''}">
                                        <div class="flex items-center justify-center">${icons.add}</div>
                                        <span>Add ${key}</span>
                                    </button>
                                `;
                            })}
                        </div>
                        <div class="effects-display-mount-point space-y-3">
                            ${gen.effects.map(fx => window.ComponentModule_EffectPanels.render(gen, fx, appStateInstance))}
                        </div>
                    </div>
                </section>
            </div>
        `;

        // Bootstrap visual status configurations from current states
        ctrl.setWaveTypeUI(cardEl, gen.type);
        ctrl.setInvertUI(cardEl, gen.isInverted);
        ctrl.setMuteUI(cardEl, gen.isMuted);

        // Bind interactive elements
        ctrl.bindInteractions(cardEl, gen, appStateInstance);

        return cardEl;
    }
};
