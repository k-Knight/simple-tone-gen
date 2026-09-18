window.ComponentModule_SubOscillator = {
    render(gen, sub, subIndex, appStateInstance) {
        const knob = window.ComponentModule_Knob.render;
        const icons = window.ResourceModule_Icons;

        if (!sub._defaults) {
            sub._defaults = {
                multiplier: sub.multiplier ?? 0.5,
                loudness: sub.loudness ?? 0.20,
                pan: sub.pan ?? 0.0,
                timeShift: sub.timeShift ?? 0.0,
                k: sub.k ?? 0.0,
                pow: sub.pow ?? 1.0
            };
        }

        const isInvertedStr = sub.isInverted ? "true" : "false";
        const isMutedStr = sub.isMuted ? "true" : "false";

        const subEl = html`
            <div data-sub-id="${sub.id}" class="sub-oscillator-row p-4 bg-zinc-950/60 border border-zinc-800/40 rounded-2xl space-y-3 mt-3 relative group">
                
                <div class="flex items-center justify-between gap-4 border-b border-zinc-800/40 pb-2">
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-400">SUB #${subIndex + 1}</span>
                        
                        <label class="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-400 select-none">
                            <input type="checkbox" class="sub-invert-checkbox sr-only" ${sub.isInverted ? 'checked' : ''} />
                            <div class="sub-invert-toggle w-7 h-4 bg-zinc-800 rounded-xl relative border border-zinc-700 transition-all flex items-center px-0.5 data-[active=${isInvertedStr}]:bg-cyan-950/40 data-[active=${isInvertedStr}]:border-cyan-500/50">
                                <div class="w-2.5 h-2.5 bg-zinc-400 rounded-full transition-all transform data-[active=${isInvertedStr}]:bg-cyan-400 data-[active=${isInvertedStr}]:translate-x-3"></div>
                            </div>
                            <span>Invert</span>
                        </label>

                        <button class="sub-mute-toggle-btn px-2 py-0.5 text-[11px] border border-zinc-700/40 rounded-md uppercase tracking-wider font-bold transition-all flex items-center gap-1 cursor-pointer bg-zinc-950/40 text-zinc-500 data-[active=${isMutedStr}]:bg-rose-950/80 data-[active=${isMutedStr}]:text-rose-400 data-[active=${isMutedStr}]:border-rose-800/60"
                                data-active="${isMutedStr}">
                            <div class="sub-mute-dot w-1.5 h-1.5 rounded-full bg-zinc-700 transition-all data-[active=${isMutedStr}]:bg-rose-400 data-[active=${isMutedStr}]:animate-pulse"></div>
                            <span>Mute</span>
                        </button>
                    </div>

                    <button class="remove-sub-btn flex items-center justify-center p-1 w-7 h-7 text-zinc-500 hover:text-rose-400 bg-zinc-800/40 hover:bg-rose-800/40 border border-zinc-700/60 hover:border-rose-600 rounded-md transition-all cursor-pointer shadow-sm select-none">
                        ${icons.remove}
                    </button>
                </div>

                <div class="wave-type-selectors-container flex bg-zinc-950 p-1 border border-zinc-800 rounded-xl text-[11px] w-full">
                    ${appStateInstance.waveTypes.map(w => {
                        const isWaveActiveStr = sub.type === w ? "true" : "false";
                        return html`
                            <button data-wave="${w}"
                                    data-active="${isWaveActiveStr}"
                                    class="sub-wave-btn flex-grow text-center px-1.5 py-0.5 rounded-lg border border-transparent capitalize text-zinc-400 transition-all cursor-pointer data-[active=true]:bg-zinc-800 data-[active=true]:text-cyan-400 data-[active=true]:border-zinc-700">
                                ${w}
                            </button>
                        `;
                    })}
                </div>

                <div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 justify-center">
                    ${knob(sub, 'multiplier', 'Multiplier', 0.1, 16.0, 0.01, false, 'x', () => appStateInstance.sync(gen.id), 'cyan')}
                    ${knob(sub, 'loudness', 'Loudness', 0, 1, 0.01, false, '%', () => appStateInstance.sync(gen.id), 'cyan')}
                    ${knob(sub, 'pan', 'Balance', -1, 1, 0.01, false, 'Bal', () => appStateInstance.sync(gen.id), 'cyan')}
                    ${knob(sub, 'timeShift', 'Time Shift', 0, 0.05, 0.0001, false, 'Sec', () => appStateInstance.sync(gen.id), 'cyan')}
                    ${(() => {
                        const p = appStateInstance.waveProfiles[sub.type];
                        if (!p || p.min === p.max) return null;
                        return knob(sub, 'k', 'Modifier', p.min, p.max, p.step, true, 'k', () => appStateInstance.sync(gen.id), 'cyan');
                    })()}
                    ${knob(sub, 'pow', 'Exponent', 0, 10, 0.01, true, 'pow', () => appStateInstance.sync(gen.id), 'cyan')}
                </div>
            </div>
        `;

        subEl.querySelectorAll('.sub-wave-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const selectedWave = e.currentTarget.getAttribute('data-wave');
                sub.type = selectedWave;
                
                const profile = appStateInstance.waveProfiles[selectedWave];
                sub.k = profile ? profile.default : 0;
                
                appStateInstance.sync(gen.id);
                window.audio.restartSimulation();

                const freshRow = this.render(gen, sub, subIndex, appStateInstance);
                subEl.replaceWith(freshRow);
            });
        });

        const invCheck = subEl.querySelector('.sub-invert-checkbox');
        invCheck.addEventListener('change', e => {
            sub.isInverted = e.currentTarget.checked;
            appStateInstance.sync(gen.id);
            
            const nextInvStr = sub.isInverted ? "true" : "false";
            const visualToggle = subEl.querySelector('.sub-invert-toggle');
            visualToggle.setAttribute('data-active', nextInvStr);
            visualToggle.firstElementChild.setAttribute('data-active', nextInvStr);
        });

        const muteBtn = subEl.querySelector('.sub-mute-toggle-btn');
        muteBtn.addEventListener('click', () => {
            sub.isMuted = !sub.isMuted;
            appStateInstance.sync(gen.id);
            window.audio.restartSimulation();

            const nextMuteStr = sub.isMuted ? "true" : "false";
            muteBtn.setAttribute('data-active', nextMuteStr);
            subEl.querySelector('.sub-mute-dot').setAttribute('data-active', nextMuteStr);
        });

        subEl.querySelector('.remove-sub-btn').addEventListener('click', () => {
            gen.subOscillators = gen.subOscillators.filter(s => s.id !== sub.id);
            subEl.remove();
            
            appStateInstance.sync(gen.id);
            window.audio.restartSimulation();
        });

        return subEl;
    }
};
