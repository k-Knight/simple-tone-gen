window.ComponentModule_CustomWaveCanvasHeader = {
    render() {
        return html`
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3 mb-2">
                <div class="space-y-0.5">
                    <h2 class="text-sm font-mono text-cyan-400 font-bold uppercase tracking-wider">Spline Waveform Designer</h2>
                </div>
                <button id="closeWaveEditorBtn" class="flex items-center justify-center p-1 w-7 h-7 text-zinc-500 hover:text-rose-400 bg-zinc-800/40 hover:bg-rose-800/40 border border-zinc-700/60 hover:border-rose-600 rounded-md transition-all cursor-pointer shadow-sm select-none">
                    ✕
                </button>
            </div>
        `;
    }
};