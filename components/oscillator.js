window.ComponentModule_Oscillator = {
    render(gen, index, appStateInstance) {
        const knob = window.ComponentModule_Knob.render;
        const icons = window.ResourceModule_Icons;

        const card = html`
            <div data-osc-id="${gen.id}" class="oscillator-card-root space-y-3 bg-zinc-900/30 p-4 border border-zinc-800/60 rounded-2xl relative transition-all">
                <section class="p-6 bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-lg">
                    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
                        <div class="flex flex-wrap items-center gap-4">
                            <span class="text-xs font-mono px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">OSC #${index + 1}</span>
                            <div class="wave-type-selectors-container flex bg-zinc-950 p-1 border border-zinc-800 rounded-xl text-xs">
                                ${appStateInstance.waveTypes.map(w => html`
                                    <button data-wave="${w}" class="wave-type-btn px-2.5 py-1 rounded-lg border capitalize cursor-pointer ${gen.type === w ? 'bg-zinc-800 text-cyan-400 border-zinc-700' : 'text-zinc-400 border-transparent'}">${w}</button>
                                `)}
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
                                <input type="checkbox" class="invert-checkbox sr-only" ${gen.isInverted ? 'checked' : ''} />
                                <div class="invert-toggle-visual w-7 h-4 bg-zinc-800 rounded-full relative border border-zinc-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all ${gen.isInverted ? 'bg-cyan-950 after:bg-cyan-400 after:translate-x-3' : ''}"></div>
                                <span>Invert Wave</span>
                            </label>
                            <button class="mute-toggle-btn px-2.5 py-1 text-xs border rounded-lg uppercase tracking-wider font-bold transition-all flex items-center gap-1 cursor-pointer ${gen.isMuted ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-zinc-950/40 text-zinc-500 border-zinc-800'}">
                                <div class="mute-dot w-1.5 h-1.5 rounded-full ${gen.isMuted ? 'bg-rose-400 animate-pulse' : 'bg-zinc-700'}"></div>
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
                        ${knob(gen, 'timeShift', 'Time Shift', 0, 0.05, 0.001, false, 'Sec', () => appStateInstance.sync(gen.id), 'cyan')}
                    </div>

                    <div class="mt-4 pt-4 border-t border-zinc-800/50 space-y-3">
                        <div class="flex items-center gap-3">
                            <button class="unison-action-trigger px-3 py-1.5 border border-purple-900 bg-purple-950/30 hover:bg-purple-900/40 text-purple-400 text-xs font-bold rounded-xl transition-all uppercase tracking-wide cursor-pointer flex items-center gap-2 ${gen.effects.some(f => f.type === 'unison') ? 'hidden' : ''}">
                                <div class="flex items-center justify-center text-purple-400">${icons.add}</div>
                                <span>Add Multi-Voice Unison</span>
                            </button>
                            <button class="haas-action-trigger px-3 py-1.5 border border-cyan-900 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-400 text-xs font-bold rounded-xl transition-all uppercase tracking-wide cursor-pointer flex items-center gap-2 ${gen.effects.some(f => f.type === 'timespread') ? 'hidden' : ''}">
                                <div class="flex items-center justify-center text-cyan-400">${icons.add}</div>
                                <span>Add Stereo Haas Spreader</span>
                            </button>
                        </div>
                        <div class="effects-display-mount-point space-y-3">
                            ${gen.effects.map(fx => window.ComponentModule_EffectPanels.render(gen, fx))}
                        </div>
                    </div>
                </section>
            </div>
        `;

        const cardSurreal = any(card);

        any('.wave-type-btn', card).on('click', e => {
            const wave = e.currentTarget.getAttribute('data-wave');
            gen.type = wave;
            appStateInstance.sync(gen.id);
            any('.wave-type-btn', card).run(b => {
                if (b.getAttribute('data-wave') === wave) {
                    any(b).classRemove('text-zinc-400', 'border-transparent').classAdd('bg-zinc-800', 'text-cyan-400', 'border-zinc-700');
                } else {
                    any(b).classRemove('bg-zinc-800', 'text-cyan-400', 'border-zinc-700').classAdd('text-zinc-400', 'border-transparent');
                }
            });
        });

        any('.invert-checkbox', card).on('change', e => {
            const active = e.currentTarget.checked;
            gen.isInverted = active;
            appStateInstance.sync(gen.id);
            const toggleVisual = any('.invert-toggle-visual', card);
            if (active) toggleVisual.classAdd('bg-cyan-950', 'after:bg-cyan-400', 'after:translate-x-3');
            else toggleVisual.classRemove('bg-cyan-950', 'after:bg-cyan-400', 'after:translate-x-3');
        });

        any('.mute-toggle-btn', card).on('click', () => {
            gen.isMuted = !gen.isMuted;
            appStateInstance.sync(gen.id);
            const btn = any('.mute-toggle-btn', card);
            const dot = any('.mute-dot', card);
            
            if (gen.isMuted) {
                cardSurreal.classAdd('opacity-40', 'grayscale-[30%]');
                btn.classRemove('bg-zinc-950/40', 'text-zinc-500', 'border-zinc-800').classAdd('bg-rose-950/80', 'text-rose-400', 'border-rose-800');
                dot.classRemove('bg-zinc-700').classAdd('bg-rose-400', 'animate-pulse');
            } else {
                cardSurreal.classRemove('opacity-40', 'grayscale-[30%]');
                btn.classRemove('bg-rose-950/80', 'text-rose-400', 'border-rose-800').classAdd('bg-zinc-950/40', 'text-zinc-500', 'border-zinc-800');
                dot.classRemove('bg-rose-400', 'animate-pulse').classAdd('bg-zinc-700');
            }
        });

        any('.remove-osc-btn', card).on('click', () => appStateInstance.removeGenerator(gen.id));
        any('.unison-action-trigger', card).on('click', () => appStateInstance.addEffect(gen.id, 'unison'));
        any('.haas-action-trigger', card).on('click', () => appStateInstance.addEffect(gen.id, 'timespread'));

        // Retained Custom Component Event Handlers
        cardSurreal.on('effect-added', e => {
            const fxConfig = e.detail;
            const mount = card.querySelector('.effects-display-mount-point');
            if (mount) mount.appendChild(window.ComponentModule_EffectPanels.render(gen, fxConfig));
            if (fxConfig.type === 'unison') any('.unison-action-trigger', card).classAdd('hidden');
            if (fxConfig.type === 'timespread') any('.haas-action-trigger', card).classAdd('hidden');
        });

        cardSurreal.on('effect-removed', e => {
            if (!gen.effects.some(f => f.type === 'unison')) any('.unison-action-trigger', card).classRemove('hidden');
            if (!gen.effects.some(f => f.type === 'timespread')) any('.haas-action-trigger', card).classRemove('hidden');
        });

        return card;
    }
};
