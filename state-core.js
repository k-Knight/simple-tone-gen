window.AppStateModule = {
    create(audioInstance) {
        const state = {
            generators: [],
            waveTypes: ['sine', 'sawtooth', 'square', 'triangle', 'sharktooth', 'scallop', 'sharkfin', 'camel', 'razorback', 'trapezoid'],
            masterVolume: 0.5,
            recordDuration: 2,
            isRecording: false,

            init() {
                window.addEventListener('record-finished', () => {
                    this.isRecording = false;
                    audioInstance.exportWav();

                    const recBtn = document.getElementById('exportWavButton');
                    if (recBtn) {
                        recBtn.textContent = 'Export WAV';
                        recBtn.className = "px-3 py-1.5 text-xs font-bold border rounded-lg uppercase transition-all tracking-wider cursor-pointer bg-purple-950 text-purple-400 border-purple-800 hover:bg-purple-900";
                        recBtn.removeAttribute('disabled');
                    }
                });

                this.buildBaseShell();

                if (window.VisualScopeModule && window.VisualScopeModule.draw) {
                    window.VisualScopeModule.draw(audioInstance);
                }
            },

            buildBaseShell() {
                const root = document.getElementById('app-root');
                if (!root) return;
                const icons = window.ResourceModule_Icons;

                root.appendChild(html`
                    <div class="space-y-4">
                        <header class="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                <div class="md:col-span-5">
                                    <h1 class="text-2xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent select-none">Simple Tone Generator</h1>
                                    <p class="text-sm text-zinc-400 mt-1 select-none">High performance phase-accurate multi-oscillator workspace.</p>
                                </div>
                                <div class="md:col-span-7 flex items-center gap-4 bg-zinc-950/40 p-4 border border-zinc-800/60 rounded-xl">
                                    <div class="flex-1 space-y-3">
                                        <div class="flex items-center justify-between gap-3 text-xs font-mono">
                                            <span class="text-zinc-500 font-bold">MASTER:</span>
                                            <div class="flex items-center gap-2 flex-1 justify-end">
                                                <input id="masterVolumeSlider" type="range" min="0" max="1" step="0.01" value="${this.masterVolume}" class="accent-cyan-500 h-1 w-full max-w-[160px] bg-zinc-800 rounded appearance-none cursor-pointer" />
                                                <span id="masterVolumeLabel" class="text-cyan-400 w-10 text-right font-bold">${Math.round(this.masterVolume * 100)}%</span>
                                            </div>
                                        </div>
                                        <div class="border-t border-zinc-800/80 pt-3 flex items-center justify-between gap-3 text-xs font-mono">
                                            <span class="text-zinc-500 font-bold">REC FILE:</span>
                                            <div class="flex items-center gap-2">
                                                <input id="recDurationInput" type="number" min="1" max="10" value="${this.recordDuration}" class="w-10 bg-zinc-900 border border-zinc-800 rounded text-center py-1 text-purple-400 font-bold focus:outline-none" />
                                                <span class="text-zinc-500 mr-1">SEC</span>
                                                <button id="exportWavButton" class="px-3 py-1.5 text-xs font-bold border rounded-lg uppercase tracking-wider cursor-pointer bg-purple-950 text-purple-400 border-purple-800 hover:bg-purple-900">Export WAV</button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- FIXED: Swapped out sky colors for dark background variables, and added self-stretch for full vertical height -->
                                    <button id="addOscillatorButton" class="px-4 py-2 bg-zinc-900 border border-sky-800 text-sky-400 hover:bg-zinc-800 hover:border-sky-700 font-bold text-xs rounded-xl uppercase tracking-wide flex items-center gap-1.5 self-stretch transition-colors cursor-pointer">
                                        <div class="flex items-center justify-center">${icons.add}</div> Add Oscillator
                                    </button>
                                </div>
                            </div>
                            <div class="h-32 w-full bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden relative">
                                <canvas id="scopeCanvas" class="w-full h-full block"></canvas>
                            </div>
                        </header>
                        <main id="oscillatorListContainer" class="space-y-4">
                            <div id="emptyStatePlaceholder" class="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs select-none">No active oscillators. Click "Add Oscillator" to start synthesis.</div>
                        </main>
                    </div>
                `);

                any('#masterVolumeSlider').on('input', e => {
                    const val = parseFloat(e.currentTarget.value) || 0;
                    this.masterVolume = val;

                    if (!audioInstance.ctx) {
                        audioInstance.init();
                    }

                    if (audioInstance.masterGain && audioInstance.ctx) {
                        const now = audioInstance.ctx.currentTime;
                        audioInstance.masterGain.gain.cancelScheduledValues(now);
                        audioInstance.masterGain.gain.linearRampToValueAtTime(val, now + 0.005);
                    }

                    audioInstance.setMasterVolume(this.masterVolume);

                    const labelEl = document.getElementById('masterVolumeLabel');
                    if (labelEl) {
                        labelEl.textContent = `${Math.round(val * 100)}%`;
                    }
                });
                any('#recDurationInput').on('input', e => { this.recordDuration = parseInt(e.currentTarget.value) || 2; });
                any('#exportWavButton').on('click', () => this.triggerRecord());
                any('#addOscillatorButton').on('click', () => this.addGenerator());
            },

            triggerRecord() {
                if (this.isRecording) return;
                this.isRecording = true;
                audioInstance.startRecording(this.recordDuration);

                const recBtn = document.getElementById('exportWavButton');
                if (recBtn) {
                    recBtn.textContent = 'REC...';
                    recBtn.className = "px-3 py-1.5 text-xs font-bold border rounded-lg uppercase transition-all tracking-wider cursor-not-allowed bg-rose-950/40 text-rose-400 border-rose-900/50";
                    recBtn.setAttribute('disabled', 'true');
                }
            },

            sync(id) {
                const inst = this.generators.find(g => g.id === id);
                if (inst) audioInstance.updateGenerator(id, inst);
            }
        };

        Object.assign(state, window.StateGeneratorsModule.getActions(state, audioInstance));
        Object.assign(state, window.StateEffectsModule.getActions(state, audioInstance));

        return state;
    }
};
