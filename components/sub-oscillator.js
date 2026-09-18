window.ComponentModule_SubOscillator = {
    render(gen, sub, subIndex, appStateInstance) {
        const knob = window.ComponentModule_Knob.render;
        const icons = window.ResourceModule_Icons;

        if (!sub._defaults) {
            sub._defaults = {
                multiplier: sub.multiplier ?? 1.0,
                loudness: sub.loudness ?? 0.20,
                pan: sub.pan ?? 0.0,
                timeShift: sub.timeShift ?? 0.0,
                k: sub.k ?? 0.0,
                pow: sub.pow ?? 1.0
            };
        }

        const subEl = html`
            <div data-sub-id="${sub.id}" class="sub-oscillator-row p-4 bg-zinc-900/30 border border-zinc-800/60 rounded-2xl space-y-3 mt-3 relative group transition-all">
                <div class="flex items-center justify-between gap-4 border-b border-zinc-800 pb-2 mb-4 w-full">
                    <div class="flex items-center gap-4">
                        <span class="text-xs font-mono px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">SUB #${subIndex + 1}</span>
                        
                        <label class="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 select-none">
                            <input type="checkbox" class="sub-invert-checkbox sr-only" ${sub.isInverted ? 'checked' : ''} />
                            <div class="sub-invert-toggle w-7 h-4 bg-zinc-800 rounded-xl relative border border-zinc-700 transition-all flex items-center px-0.5 data-[active=true]:bg-cyan-950/40 data-[active=true]:border-cyan-500/50"
                                 data-active="${sub.isInverted ? 'true' : 'false'}">
                                <div class="sub-invert-ball w-2.5 h-2.5 bg-zinc-400 rounded-full transition-all transform data-[active=true]:bg-cyan-400 data-[active=true]:translate-x-3"
                                     data-active="${sub.isInverted ? 'true' : 'false'}"></div>
                            </div>
                            <span>Invert Wave</span>
                        </label>
                        
                        <button class="sub-mute-toggle-btn px-2.5 py-1 text-xs border border-zinc-700/40 rounded-lg uppercase tracking-wider font-bold transition-all flex items-center gap-1 cursor-pointer bg-zinc-950/40 text-zinc-500 data-[active=true]:bg-rose-950/80 data-[active=true]:text-rose-400 data-[active=true]:border-rose-800/60"
                            data-active="${sub.isMuted ? 'true' : 'false'}">
                            <div class="sub-mute-dot w-1.5 h-1.5 rounded-full bg-zinc-700 transition-all data-[active=true]:bg-rose-400 data-[active=true]:animate-pulse"
                                 data-active="${sub.isMuted ? 'true' : 'false'}"></div>
                            <span>Mute</span>
                        </button>
                    </div>

                    <button class="remove-sub-btn flex items-center justify-center p-1 w-8 h-8 text-zinc-500 hover:text-rose-400 bg-zinc-800/40 hover:bg-rose-800/40 border border-zinc-700/60 hover:border-rose-600 rounded-md transition-all cursor-pointer shadow-sm select-none" title="Remove Sub-Oscillator">
                        ${icons.remove}
                    </button>
                </div>

                <div class="wave-type-selectors-container flex flex-wrap bg-zinc-950 p-1 border border-zinc-800 rounded-xl text-xs w-full">
                    ${appStateInstance.waveTypes.map(w => html`
                        <button data-wave="${w}"
                                data-active="${sub.type === w ? 'true' : 'false'}"
                                class="sub-wave-btn flex-grow text-center px-2.5 py-1 rounded-lg border border-transparent capitalize text-zinc-400 transition-all cursor-pointer data-[active=true]:bg-zinc-800 data-[active=true]:text-cyan-400 data-[active=true]:border-zinc-700">
                            ${w}
                        </button>
                    `)}
                </div>

                <div class="sub-knobs-grid grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 justify-center">
                    ${knob(sub, 'multiplier', 'Multiplier', 0.1, 16.0, 0.01, false, 'x', () => appStateInstance.sync(gen.id), 'cyan')}
                    ${knob(sub, 'loudness', 'Loudness', 0, 1, 0.01, false, '%', () => appStateInstance.sync(gen.id), 'cyan')}
                    ${knob(sub, 'pan', 'Balance', -1, 1, 0.01, false, 'Bal', () => appStateInstance.sync(gen.id), 'cyan')}
                    ${knob(sub, 'timeShift', 'Phase Offset', -2, 2, 0.001, false, 'T', () => appStateInstance.sync(gen.id), 'cyan')}
                    ${(() => {
                        const p = appStateInstance.waveProfiles[sub.type];
                        if (!p || p.min === p.max) return null;
                        const modEl = knob(sub, 'k', 'Modifier', p.min, p.max, p.step, true, 'k', () => appStateInstance.sync(gen.id), 'cyan');
                        modEl.classList.add('sub-knob-k-target');
                        return modEl;
                    })()}
                    ${knob(sub, 'pow', 'Exponent', 0, 10, 0.01, true, 'pow', () => appStateInstance.sync(gen.id), 'cyan')}
                </div>
            </div>
        `;

        subEl.querySelectorAll('.sub-wave-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const wave = e.currentTarget.getAttribute('data-wave');
                sub.type = wave;
                const p = appStateInstance.waveProfiles[wave];
                sub.k = p ? p.default : 0;
                
                appStateInstance.sync(gen.id);
                window.audio.restartSimulation();

                subEl.querySelectorAll('.sub-wave-btn').forEach(b => {
                    b.setAttribute('data-active', b.getAttribute('data-wave') === wave ? 'true' : 'false');
                });

                const grid = subEl.querySelector('.sub-knobs-grid');
                const existingKnob = grid.querySelector('.sub-knob-k-target');
                if (!p || p.min === p.max) {
                    if (existingKnob) existingKnob.remove();
                    return;
                }

                const freshKnob = knob(sub, 'k', 'Modifier', p.min, p.max, p.step, true, 'k', () => appStateInstance.sync(gen.id), 'cyan');
                freshKnob.classList.add('sub-knob-k-target');

                if (existingKnob) {
                    existingKnob.replaceWith(freshKnob);
                } else {
                    const powKnob = grid.querySelector('input[min="0"][max="10"]')?.closest('.knob-container-block') || grid.lastElementChild;
                    if (powKnob) grid.insertBefore(freshKnob, powKnob);
                    else grid.appendChild(freshKnob);
                }
            });
        });

        const invCheck = subEl.querySelector('.sub-invert-checkbox');
        invCheck.addEventListener('change', e => {
            sub.isInverted = e.currentTarget.checked;
            appStateInstance.sync(gen.id);
            window.audio.restartSimulation();
            
            const nextActiveStr = sub.isInverted ? 'true' : 'false';
            const toggleWrapper = subEl.querySelector('.sub-invert-toggle');
            const toggleBall = subEl.querySelector('.sub-invert-ball');
            
            toggleWrapper.setAttribute('data-active', nextActiveStr);
            toggleBall.setAttribute('data-active', nextActiveStr);
        });

        const muteBtn = subEl.querySelector('.sub-mute-toggle-btn');
        muteBtn.addEventListener('click', () => {
            sub.isMuted = !sub.isMuted;
            appStateInstance.sync(gen.id);
            window.audio.restartSimulation();
            
            const nextActiveStr = sub.isMuted ? 'true' : 'false';
            muteBtn.setAttribute('data-active', nextActiveStr);
            subEl.querySelector('.sub-mute-dot').setAttribute('data-active', nextActiveStr);
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
