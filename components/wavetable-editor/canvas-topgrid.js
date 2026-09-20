window.ComponentModule_CustomWaveCanvasTopGrid = {
    render() {
        return html`
            <div class="grid grid-cols-1 md:grid-cols-2 border-b border-zinc-800 bg-zinc-950/40">
                <div class="p-4 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-center space-y-1.5 bg-zinc-900/10">
                    <span class="text-zinc-400 font-bold uppercase text-[10px]">Wavetable Name / Edit Existing Wavetable:</span>
                    <input type="text" value="Custom Patch Patch" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 font-bold focus:outline-none focus:border-zinc-700" placeholder="Unnamed Patch..." />
                </div>
                <div class="p-4 space-y-2 bg-zinc-950/10 flex flex-col justify-center">
                    <span class="text-zinc-400 font-bold uppercase text-[10px] block">File System Automation / Visual Editor:</span>
                    <div class="grid grid-cols-3 gap-2">
                        <button class="px-2 py-1.5 border border-purple-700 hover:border-purple-600 bg-purple-950/40 hover:bg-purple-950/80 text-purple-400 hover:text-purple-300 font-extrabold rounded-lg transition-all text-center cursor-pointer text-[10px] uppercase shadow-md shadow-purple-950/50">
                            ↑ Export WAV
                        </button>
                        <button class="px-2 py-1.5 border border-indigo-700 hover:border-indigo-600 bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-400 hover:text-indigo-300 font-extrabold rounded-lg transition-all text-center cursor-pointer text-[10px] uppercase shadow-md shadow-indigo-950/50">
                            ↓ Load WAV
                        </button>
                        <button class="px-2 py-1.5 border border-emerald-600 hover:border-emerald-500 bg-emerald-950/40 hover:bg-emerald-950/80 text-emerald-400 hover:text-emerald-200 font-extrabold rounded-lg transition-all text-center cursor-pointer text-[10px] uppercase shadow-md shadow-emerald-950/50">
                            ✓ Save Patch
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};
