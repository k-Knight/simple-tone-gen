window.ComponentModule_CustomWaveDefaultState = () => ({
    customWaveTable: new Float32Array(256),
    splineTension: 0.0,
    useSplineSmoothing: true,
    lockEndsTogether: false,
    importMode: 'spline',
    rawFileBuffer: null,
    fileStartOffset: 0,
    fileWindowSize: 256,
    splineNodes: [
        { id: crypto.randomUUID(), x: 0.0, y: 0.01, isFixed: true },
        { id: crypto.randomUUID(), x: 1.0, y: -0.01, isFixed: true }
    ]
});

window.ComponentModule_CustomWaveCanvas = {
    render(globalCustomWavetables) {
        const localContext = window.ComponentModule_CustomWaveDefaultState();
        const viewSize = 300;
        const totalWidth = viewSize * 3;

        const containerEl = html`
            <div id="waveEditorPopup" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
                <section class="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl space-y-4 max-w-5xl w-full max-h-[95vh] overflow-y-auto relative">
                    ${window.ComponentModule_CustomWaveCanvasHeader.render()}
                    ${window.ComponentModule_CustomWaveCanvasTable.render(localContext, viewSize, totalWidth)}
                </section>

                <div id="wavetableLibraryPopup" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4">
                    <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full space-y-4 font-mono text-xs">
                        <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <span class="text-amber-400 font-bold uppercase tracking-wider">Load Existing Wavetable</span>
                            <button id="closeWavetableLibraryBtn" class="text-zinc-500 hover:text-zinc-200 cursor-pointer">✕</button>
                        </div>
                        <div id="wavetableLibraryListContainer" class="max-h-60 overflow-y-auto space-y-1.5 pr-1"></div>
                    </div>
                </div>

                <div id="wavetableOverwriteConfirmPopup" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4">
                    <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full space-y-4 font-mono text-xs text-center">
                        <div class="text-rose-400 font-bold uppercase text-sm tracking-wider">⚠ Overwrite Warning</div>
                        <p class="text-zinc-300 leading-relaxed">
                            A wavetable named <span id="overwriteTargetNameDisplay" class="text-cyan-400 font-bold"></span> already exists. Do you want to overwrite it?
                        </p>
                        <div class="grid grid-cols-2 gap-3 pt-2">
                            <button id="cancelOverwriteBtn" class="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 font-bold transition-all cursor-pointer uppercase text-[10px]">
                                Cancel
                            </button>
                            <button id="confirmOverwriteBtn" class="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-400 hover:text-rose-200 font-bold rounded-lg transition-all cursor-pointer uppercase text-[10px]">
                                Overwrite
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const libPopup = me('#wavetableLibraryPopup', containerEl);
            const listContainer = me('#wavetableLibraryListContainer', containerEl);

            me('#openWavetableLibraryBtn', containerEl).on('click', () => {
                if (!libPopup || !listContainer) return;
                listContainer.innerHTML = '';
                
                const savedKeys = Object.keys(globalCustomWavetables || {});
                
                if (savedKeys.length === 0) {
                    listContainer.appendChild(html`
                        <div class="text-center py-6 text-zinc-500 italic select-none">No saved custom wavetables found.</div>
                    `);
                } else {
                    savedKeys.forEach(nameKey => {
                        const itemRow = html`
                            <button class="w-full flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 hover:border-amber-600 rounded text-left text-zinc-300 hover:text-zinc-100 font-bold transition-all cursor-pointer">
                                <span>📁 ${nameKey}</span>
                                <span class="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded">
                                    ${globalCustomWavetables[nameKey]['editor-state'] ? 'Spline' : 'Raw File'}
                                </span>
                            </button>
                        `;

                        me(itemRow).on('click', () => {
                            window.openCustomWaveEditor(nameKey);
                            libPopup.classList.add('hidden');
                        });

                        listContainer.appendChild(itemRow);
                    });
                }
                libPopup.classList.remove('hidden');
            });

            me('#closeWavetableLibraryBtn', containerEl).on('click', () => {
                if (libPopup) libPopup.classList.add('hidden');
            });
        }, 20);

        window.ComponentModule_CustomWaveInteractions.bind(containerEl, localContext, viewSize, globalCustomWavetables);
        return containerEl;
    }
};
