window.ComponentModule_Oscillator = {
    render(gen, index, appStateInstance) {
        const knob = window.ComponentModule_Knob.render;
        const icons = window.ResourceModule_Icons;
        const ctrl = window.ComponentModule_OscillatorController;

        const cardEl = html`
            <div data-osc-id="${gen.id}" class="oscillator-card-root space-y-3 bg-zinc-900/30 p-4 border border-zinc-800/60 rounded-2xl relative transition-all">
                <section class="p-6 bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-lg">
                    <div class="flex flex-col gap-4 border-b border-zinc-800 pb-4 mb-6 w-full">

                        <div class="flex items-center justify-between gap-4 w-full">
                            <div class="flex items-center gap-4">
                                <span class="text-xs font-mono px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">OSC #${index + 1}</span>

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

                            <button class="remove-osc-btn flex items-center justify-center p-1 w-8 h-8 text-zinc-500 hover:text-rose-400 bg-zinc-800/40 hover:bg-rose-800/40 border border-zinc-700/60 hover:border-rose-600 rounded-md transition-all cursor-pointer shadow-sm select-none" title="Remove Oscillator">
                                ${icons.remove}
                            </button>
                        </div>

                        <div class="wave-type-selectors-container flex flex-wrap bg-zinc-950 p-1 border border-zinc-800 rounded-xl text-xs w-full">
                            ${appStateInstance.waveTypes.map(w => html`
                                <button data-wave="${w}"
                                        data-active="${gen.type === w ? 'true' : 'false'}"
                                        class="wave-type-btn flex-grow text-center px-2.5 py-1 rounded-lg border border-transparent capitalize text-zinc-400 transition-all cursor-pointer data-[active=true]:bg-zinc-800 data-[active=true]:text-cyan-400 data-[active=true]:border-zinc-700">
                                    ${w}
                                </button>
                            `)}
                        </div>
                    </div>

                    <div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 justify-center">
                        ${knob(gen, 'frequency', 'Frequency', ABSOLUTE_MIN_FREQ, ABSOLUTE_MAX_FREQ, 1, true, 'Hz', () => appStateInstance.sync(gen.id), 'cyan')}
                        ${knob(gen, 'loudness', 'Loudness', 0, 1, 0.01, false, '%', () => appStateInstance.sync(gen.id), 'cyan')}
                        ${knob(gen, 'pan', 'Balance', -1, 1, 0.01, false, 'Bal', () => appStateInstance.sync(gen.id), 'cyan')}
                        ${knob(gen, 'timeShift', 'Phase Offset', -2, 2, 0.001, false, 'T', () => appStateInstance.sync(gen.id), 'cyan')}

                        ${(() => {
                            const p = appStateInstance.waveProfiles[gen.type];
                            if (!p || p.min === p.max) return null;

                            const el = knob(gen, 'k', 'Modifier', p.min, p.max, p.step, true, 'k', () => appStateInstance.sync(gen.id), 'cyan');
                            el.classList.add('knob-k-target');
                            return el;
                        })()}

                        ${knob(gen, 'pow', 'Exponent', 0, 10, 0.01, true, 'pow', () => appStateInstance.sync(gen.id), 'cyan')}
                    </div>

                    <div class="mt-4 pt-4 border-t border-zinc-800/50 space-y-3">
                        <div class="flex flex-wrap items-center gap-2 w-full">
                            <button class="add-sub-osc-btn px-3 py-1.5 border border-cyan-900 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-400 rounded-xl text-xs font-bold uppercase transition-all tracking-wide cursor-pointer flex items-center gap-2">
                                <div class="flex items-center justify-center">${icons.add}</div>
                                <span>Add Sub-Oscillator</span>
                            </button>
                        </div>

                        <div class="sub-oscillators-mount-point space-y-2">
                            ${(gen.subOscillators || []).map((sub, sIdx) => window.ComponentModule_SubOscillator.render(gen, sub, sIdx, appStateInstance))}
                        </div>

                        <div class="effects-display-mount-point space-y-3">
                            ${gen.effects.map(fx => window.ComponentModule_EffectPanels.render(gen, fx, appStateInstance))}
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t border-zinc-800/50 space-y-3">
                        <div class="flex flex-wrap items-center gap-2 w-full">
                            ${Object.keys(window.EffectRegistry).map(key => {
                                if (typeof window.EffectRegistry[key] === 'function') return null;

                                const fxDef = window.EffectRegistry[key];
                                const isAdded = gen.effects.some(f => f.type === key);

                                return html`
                                    <button data-add-fx="${key}"
                                            class="px-3 py-1.5 border rounded-xl text-xs font-bold uppercase transition-all tracking-wide cursor-pointer flex items-center gap-2 border-${fxDef.theme}-900 bg-${fxDef.theme}-950/30 hover:bg-${fxDef.theme}-900/40 text-${fxDef.theme}-400 ${isAdded ? 'hidden' : ''}"
                                            onClick=${() => appStateInstance.addEffect(gen.id, key)}>
                                        <div class="flex items-center justify-center">${icons.add}</div>
                                        <span>Add ${key}</span>
                                    </button>
                                `;
                            })}
                        </div>
                    </div>
                </section>
            </div>
        `;

        ctrl.setWaveTypeUI(cardEl, gen.type);
        ctrl.setInvertUI(cardEl, gen.isInverted);
        ctrl.setMuteUI(cardEl, gen.isMuted);

        ctrl.bindInteractions(cardEl, gen, appStateInstance);

        const addSubBtn = cardEl.querySelector('.add-sub-osc-btn');
        if (addSubBtn) {
            addSubBtn.addEventListener('click', () => {
                if (!gen.subOscillators) gen.subOscillators = [];

                const newSub = {
                    id: crypto.randomUUID(),
                    type: 'sine',
                    multiplier: 1.0,
                    loudness: 0.20,
                    pan: 0.0,
                    timeShift: 0.0,
                    k: 0.0,
                    pow: 1.0,
                    isInverted: false,
                    isMuted: false
                };

                gen.subOscillators.push(newSub);
                appStateInstance.sync(gen.id);

                const mount = cardEl.querySelector('.sub-oscillators-mount-point');
                if (mount) {
                    const subRow = window.ComponentModule_SubOscillator.render(gen, newSub, gen.subOscillators.length - 1, appStateInstance);
                    mount.appendChild(subRow);
                }
                window.audio.restartSimulation();
            });
        }

        return cardEl;
    }
};
