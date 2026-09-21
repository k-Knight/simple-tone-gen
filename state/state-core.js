window.AppStateModule = {
    create(audioInstance) {
        const state = {
            generators: [],
            waveProfiles: {
                sine: { min: -0.999, max: 0.999, step: 0.001, default: 0 },
                sawtooth: { min: 0.5, max: 100, step: 0.001, default: 0.5 },
                square: { min: 0, max: 1, step: 0.001, default: 0.5 },
                triangle: { min: 0, max: 100, step: 0.001, default: 0 },
                sharktooth: { min: 0, max: 100, step: 0.001, default: 0.5 },
                scallop: { min: 0, max: 100, step: 0.001, default: 0.5 },
                sharkfin: { min: 0, max: 10, step: 0.001, default: 0.3 },
                camel: { min: -3, max: 3, step: 0.001, default: 1 },
                pulse: { min: 0, max: 100, step: 0.001, default: 5.0 },
                wavetable: { min: 0, max: 0, step: 0, isCustom: true }
            },
            get waveTypes() { return Object.keys(this.waveProfiles); },
            masterVolume: 0.5,
            recordDuration: 2,
            isRecording: false,
            customWavetables: {},

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
                        <header class="sticky top-0 z-50 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_10px_0_0_var(--color-zinc-950,rgb(9_9_11)),0_25px_30px_-5px_rgba(0,0,0,0.5)] space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                <div class="md:col-span-4">
                                    <h1 class="text-2xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent select-none">Simple Tone Generator</h1>
                                    <p class="text-sm text-zinc-400 mt-1 select-none">Bad performance phase-accurate multi-oscillator workspace.</p>
                                </div>
                                <div class="md:col-span-8 bg-zinc-950/40 p-4 border border-zinc-800/60 rounded-xl flex flex-col gap-3">
                                    <div class="flex items-center gap-4 w-full">
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

                                        <button id="addOscillatorButton" class="px-4 py-2 bg-zinc-900 border border-sky-800 text-sky-400 hover:bg-zinc-800 hover:border-sky-700 font-bold text-xs rounded-xl uppercase tracking-wide flex items-center gap-1.5 self-stretch transition-colors cursor-pointer justify-center min-w-[150px]">
                                            <div class="flex items-center justify-center">${icons.add}</div> Add Oscillator
                                        </button>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-center border-t border-zinc-800/60 pt-3 mt-1">
                                        <div class="md:col-span-2">
                                            <button id="openWaveDesignerBtn" class="px-3 py-1.5 bg-zinc-900 border border-cyan-800/60 hover:border-cyan-700 text-cyan-400 font-bold text-[10px] rounded-lg uppercase tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer w-full justify-center shadow-sm">
                                                Open Wavetable Designer
                                            </button>
                                        </div>
                                        <div class="md:col-span-3 flex items-center justify-end gap-2 font-mono text-[9px]">
                                            <button id="saveWorkspaceButton" class="px-2.5 py-1.5 bg-zinc-900 border border-emerald-700/60 hover:border-emerald-700 text-emerald-200/80 hover:text-emerald-400 rounded-lg transition-all font-bold uppercase tracking-wide shadow-sm cursor-pointer">
                                                Save Workspace
                                            </button>
                                            <div class="relative">
                                                <input type="file" id="loadWorkspaceFileInput" accept=".json" class="hidden" />
                                                <button id="loadWorkspaceButton" class="px-2.5 py-1.5 bg-zinc-900 border border-amber-700/60 hover:border-amber-700 text-amber-200/80 hover:text-amber-400 text-[10px] rounded-lg transition-all font-bold uppercase tracking-wide shadow-sm cursor-pointer">
                                                    Load Workspace
                                                </button>
                                            </div>
                                        </div>
                                    </div>

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

                any('#openWaveDesignerBtn').on('click', () => {
                    window.openCustomWaveEditor();
                });

                any('#saveWorkspaceButton').on('click', () => this.exportWorkspaceJSON());
                const fileInputElem = document.getElementById('loadWorkspaceFileInput');

                any('#loadWorkspaceButton').on('click', () => { if (fileInputElem) fileInputElem.click(); });
                if (fileInputElem) {
                    fileInputElem.addEventListener('change', (e) => {
                        const filesList = e.target.files;
                        if (!filesList || filesList.length === 0) return;

                        const targetFileBlob = filesList[0];

                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            this.importWorkspaceJSON(evt.target.result);
                            fileInputElem.value = '';
                        };
                        reader.readAsText(targetFileBlob);
                    });
                }

                const hiddenModalNode = window.ComponentModule_CustomWaveCanvas.render(this.customWavetables);
                document.body.appendChild(hiddenModalNode);
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
            },

            exportWorkspaceJSON() {
                const savedGenerators = this.generators.map(g => {
                    const cleanG = JSON.parse(JSON.stringify(g));
                    delete cleanG.wavetableData;
                    delete cleanG._defaults;
                    if (cleanG.subOscillators) {
                        cleanG.subOscillators.forEach(sub => {
                            delete sub.wavetableData;
                            delete sub._defaults;
                        });
                    }
                    return cleanG;
                });

                const savedWavetables = {};
                Object.keys(this.customWavetables).forEach(nameKey => {
                    const record = this.customWavetables[nameKey];
                    savedWavetables[nameKey] = {
                        values: record.values,
                        ...(record['editor-state'] ? { 'editor-state': record['editor-state'] } : {})
                    };
                });

                const workspaceSnapshot = {
                    version: "1.0",
                    masterVolume: this.masterVolume,
                    recordDuration: this.recordDuration,
                    customWavetables: savedWavetables,
                    generators: savedGenerators
                };

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workspaceSnapshot, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `synth-workspace-${new Date().toISOString().slice(0, 10)}.json`);
                downloadAnchor.click();
                downloadAnchor.remove();
                console.log("Synth workspace state snapshot exported cleanly.");
            },

            importWorkspaceJSON(jsonTextContent) {
                try {
                    const parsed = JSON.parse(jsonTextContent);
                    if (!parsed || !parsed.generators || !parsed.customWavetables) {
                        throw new Error("Invalid workspace payload structure.");
                    }

                    audioInstance.restartSimulation();
                    audioInstance.generators.clear();
                    audioInstance.smoothState.clear();

                    this.generators = [];

                    const oscList = document.getElementById('oscillatorListContainer');
                    if (oscList) oscList.innerHTML = '';

                    this.masterVolume = parsed.masterVolume ?? 0.5;
                    this.recordDuration = parsed.recordDuration ?? 2;

                    const volumeSlider = document.getElementById('masterVolumeSlider');
                    const volumeLabel = document.getElementById('masterVolumeLabel');
                    const durationIn = document.getElementById('recDurationInput');
                    if (volumeSlider) volumeSlider.value = this.masterVolume;
                    if (volumeLabel) volumeLabel.textContent = `${Math.round(this.masterVolume * 100)}%`;
                    if (durationIn) durationIn.value = this.recordDuration;

                    this.customWavetables = parsed.customWavetables || {};

                    const loadedGens = parsed.generators || [];

                    if (loadedGens.length > 0) {
                        any('#emptyStatePlaceholder').classAdd('hidden');

                        loadedGens.forEach((gen, idx) => {
                            this.generators.push(gen);
                            audioInstance.addGenerator(gen.id);
                            this.validateAndSync(gen);

                            if (oscList) {
                                const freshCard = window.ComponentModule_Oscillator.render(gen, idx, this);
                                oscList.appendChild(freshCard);
                            }
                        });
                    } else {
                        any('#emptyStatePlaceholder').classRemove('hidden');
                    }

                    window.dispatchEvent(new CustomEvent('wavetable-registry-updated', { detail: { name: null } }));

                    audioInstance.restartSimulation();
                    console.log("Synth workspace state snapshot successfully reloaded and calibrated.");
                } catch (err) {
                    console.error("Workspace loading failure:", err);
                    alert("Error parsing workspace file. Make sure it is a valid synthesizer configuration JSON document.");
                }
            },

        };

        Object.assign(state, window.StateGeneratorsModule.getActions(state, audioInstance));
        Object.assign(state, window.StateEffectsModule.getActions(state, audioInstance));

        return state;
    }
};
