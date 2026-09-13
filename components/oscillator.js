window.ComponentModule_Oscillator = {
    render(gen, index, appStateInstance) {
        const knob = window.ComponentModule_Knob.render;
        const icons = window.ResourceModule_Icons;

        return html`
            <div class="space-y-3 bg-zinc-900/30 p-4 border border-zinc-800/60 rounded-2xl relative ${gen.isMuted ? 'opacity-40 grayscale-[30%] transition-opacity' : ''}">
                <section class="p-6 bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-lg">
                    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
                        <div class="flex flex-wrap items-center gap-4">
                            <span class="text-xs font-mono px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">OSC #${index + 1}</span>
                            <div class="flex bg-zinc-950 p-1 border border-zinc-800 rounded-xl text-xs">
                                ${appStateInstance.waveTypes.map(w => html`
                                    <button onClick=${() => { gen.type = w; appStateInstance.sync(gen.id); appStateInstance.render(); }} 
                                            class="px-2.5 py-1 rounded-lg border capitalize cursor-pointer ${gen.type === w ? 'bg-zinc-800 text-cyan-400 border-zinc-700' : 'text-zinc-400 border-transparent'}">
                                        ${w}
                                    </button>
                                `)}
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
                                <input type="checkbox" checked=${gen.isInverted} onChange=${e => { gen.isInverted = e.currentTarget.checked; appStateInstance.sync(gen.id); appStateInstance.render(); }} class="sr-only" />
                                <div class="w-7 h-4 bg-zinc-800 rounded-full relative border border-zinc-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all ${gen.isInverted ? 'bg-cyan-950 after:bg-cyan-400 after:translate-x-3' : ''}"></div>
                                <span>Invert Wave</span>
                            </label>
                            <button onClick=${() => { gen.isMuted = !gen.isMuted; appStateInstance.sync(gen.id); appStateInstance.render(); }} 
                                    class="px-2.5 py-1 text-xs border rounded-lg uppercase tracking-wider font-bold transition-all flex items-center gap-1 cursor-pointer ${gen.isMuted ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-zinc-950/40 text-zinc-500 border-zinc-800'}">
                                <div class="w-1.5 h-1.5 rounded-full ${gen.isMuted ? 'bg-rose-400 animate-pulse' : 'bg-zinc-700'}"></div>
                                Mute
                            </button>
                        </div>
                        <button onClick=${() => appStateInstance.removeGenerator(gen.id)} class="text-zinc-500 hover:text-rose-400 cursor-pointer p-1 flex items-center justify-center hover:bg-zinc-800 rounded-xl transition-all w-8 h-8 select-none" title="Remove Oscillator">
                            ${icons.remove.cloneNode(true)}
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${knob(gen, 'frequency', 'Frequency', 20, 20000, 1, true, 'Hz', () => appStateInstance.sync(gen.id), appStateInstance, 'cyan')}
                        ${knob(gen, 'loudness', 'Loudness', 0, 1, 0.01, false, '%', () => appStateInstance.sync(gen.id), appStateInstance, 'cyan')}
                        ${knob(gen, 'pan', 'Balance', -1, 1, 0.01, false, 'Bal', () => appStateInstance.sync(gen.id), appStateInstance, 'cyan')}
                        ${knob(gen, 'timeShift', 'Time Shift', 0, 0.05, 0.001, false, 'Sec', () => appStateInstance.sync(gen.id), appStateInstance, 'cyan')}
                    </div>

                    <!-- REFACTORED MODULAR EFFECTS DISPATCHER SYSTEM SECTION -->
                    <div class="mt-4 pt-4 border-t border-zinc-800/50 space-y-3">
                        <div class="flex items-center gap-3">
                            ${!gen.effects.some(fx => fx.type === 'unison') ? html`
                                <button onClick=${() => appStateInstance.addEffect(gen.id, 'unison')} class="px-3 py-1.5 border border-purple-900 bg-purple-950/30 hover:bg-purple-900/40 text-purple-400 text-xs font-bold rounded-xl transition-all uppercase tracking-wide cursor-pointer flex items-center gap-2">
                                    <div class="flex items-center justify-center text-purple-400">
                                        ${icons.add.cloneNode(true)}
                                    </div>
                                    <span>Add Multi-Voice Unison</span>
                                </button>
                            ` : ''}
                            ${!gen.effects.some(fx => fx.type === 'timespread') ? html`
                                <button onClick=${() => appStateInstance.addEffect(gen.id, 'timespread')} class="px-3 py-1.5 border border-cyan-900 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-400 text-xs font-bold rounded-xl transition-all uppercase tracking-wide cursor-pointer flex items-center gap-2">
                                    <div class="flex items-center justify-center text-cyan-400">
                                        ${icons.add.cloneNode(true)}
                                    </div>
                                    <span>Add Stereo Haas Spreader</span>
                                </button>
                            ` : ''}
                        </div>

                        ${gen.effects.map(fx => {
                            if (fx.type === 'unison') {
                                return html`
                                    <div class="p-4 bg-zinc-950/40 border border-purple-900/30 rounded-xl space-y-3 mt-2">
                                        <div class="flex items-center justify-between">
                                            <span class="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">Multi-Voice Unison Detune Modulator</span>
                                            <button onClick=${() => appStateInstance.removeEffect(gen.id, fx.id)} class="text-zinc-500 hover:text-rose-400 cursor-pointer p-1 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-colors w-7 h-7">
                                                ${icons.remove.cloneNode(true)}
                                            </button>
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            ${knob(fx, 'superDetune', 'Detune Width', 0, 20, 0.01, false, 'Hz', () => appStateInstance.sync(gen.id), appStateInstance, 'purple')}
                                            ${knob(fx, 'superLoudness', 'Unison Gain', 0, 2, 0.01, false, 'Vol', () => appStateInstance.sync(gen.id), appStateInstance, 'purple')}
                                            ${knob(fx, 'superMode', 'Voice Phase', 0, 2, 1, false, 'Mode', () => appStateInstance.sync(gen.id), appStateInstance, 'purple')}
                                        </div>
                                    </div>
                                `;
                            } else if (fx.type === 'timespread') {
                                const T = (gen.frequency > 0 ? (1.0 / gen.frequency) : 0.05) * 1.005;
                                const dynamicStep = parseFloat((T / 100).toFixed(6));

                                return html`
                                    <div class="p-4 bg-zinc-950/40 border border-cyan-900/30 rounded-xl space-y-3 mt-2">
                                        <div class="flex items-center justify-between">
                                            <span class="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">Stereo Haas Time-Spread Modulator</span>
                                            <button onClick=${() => appStateInstance.removeEffect(gen.id, fx.id)} class="text-zinc-500 hover:text-rose-400 cursor-pointer p-1 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-colors w-7 h-7">
                                                ${icons.remove.cloneNode(true)}
                                            </button>
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            ${knob(fx, 'spreadTime', 'Haas Time Shift', -T, T, dynamicStep, false, 'Sec', () => appStateInstance.sync(gen.id), appStateInstance, 'cyan')}
                                            ${knob(fx, 'spreadLoudness', 'Spread Voice Gain', 0.0, 2.0, 0.01, false, 'Vol', () => appStateInstance.sync(gen.id), appStateInstance, 'cyan')}
                                            ${knob(fx, 'spreadMode', 'Voice Density', 0, 1, 1, false, 'Vcs', () => appStateInstance.sync(gen.id), appStateInstance, 'cyan')}
                                        </div>
                                    </div>
                                `;
                            }
                            return '';
                        })}
                    </div>
                </section>
            </div>
        `;
    }
};
