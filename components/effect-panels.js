window.ComponentModule_EffectPanels = {
    render(gen, fx) {
        const knob = window.ComponentModule_Knob.render;
        const icons = window.ResourceModule_Icons;

        if (fx.type === 'unison') {
            return html`
                <div data-fx-id="${fx.id}" class="p-4 bg-zinc-950/40 border border-purple-900/30 rounded-xl space-y-3 mt-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">Multi-Voice Unison Detune Modulator</span>
                        <button onClick=${() => window.AppState.removeEffect(gen.id, fx.id)} class="text-zinc-500 hover:text-rose-400 p-1 flex items-center justify-center hover:bg-zinc-800 rounded-md w-7 h-7 cursor-pointer">
                            ${icons.remove}
                        </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        ${knob(fx, 'superDetune', 'Detune Width', 0, 20, 0.01, false, 'Hz', () => window.AppState.sync(gen.id), 'purple')}
                        ${knob(fx, 'superLoudness', 'Unison Gain', 0, 2, 0.01, false, 'Vol', () => window.AppState.sync(gen.id), 'purple')}
                        ${knob(fx, 'superMode', 'Voice Phase', 0, 2, 1, false, 'Mode', () => window.AppState.sync(gen.id), 'purple')}
                    </div>
                </div>
            `;
        }

        if (fx.type === 'timespread') {
            const T = (gen.frequency > 0 ? (1.0 / gen.frequency) : 0.05) * 1.005;
            const dynamicStep = parseFloat((T / 100).toFixed(6));

            return html`
                <div data-fx-id="${fx.id}" class="p-4 bg-zinc-950/40 border border-cyan-900/30 rounded-xl space-y-3 mt-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">Stereo Haas Time-Spread Modulator</span>
                        <button onClick=${() => window.AppState.removeEffect(gen.id, fx.id)} class="text-zinc-500 hover:text-rose-400 p-1 flex items-center justify-center hover:bg-zinc-800 rounded-md w-7 h-7 cursor-pointer">
                            ${icons.remove}
                        </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        ${knob(fx, 'spreadTime', 'Haas Time Shift', -T, T, dynamicStep, false, 'Sec', () => window.AppState.sync(gen.id), 'cyan')}
                        ${knob(fx, 'spreadLoudness', 'Spread Voice Gain', 0.0, 2.0, 0.01, false, 'Vol', () => window.AppState.sync(gen.id), 'cyan')}
                        ${knob(fx, 'spreadMode', 'Voice Density', 0, 1, 1, false, 'Vcs', () => window.AppState.sync(gen.id), 'cyan')}
                    </div>
                </div>
            `;
        }
        return null;
    }
};
