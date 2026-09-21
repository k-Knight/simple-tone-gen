window.ComponentModule_CustomWaveCanvasTopGrid = {
    render() {
        return html`
            <div class="grid grid-cols-1 md:grid-cols-2 border-b border-zinc-800 bg-zinc-950/40">
                <div class="p-4 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-center space-y-1.5 bg-zinc-900/10">
                    <span class="text-zinc-400 font-bold uppercase text-[10px]">Wavetable Name</span>
                    <input id="wavetableNameInput" type="text" value="Custom Wavetable" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 font-bold focus:outline-none focus:border-zinc-700" placeholder="Unnamed Patch..." />

                    <div class="grid grid-cols-2 gap-2 w-full">
                        <button id="saveWavetableBtn" class="px-2 py-1.5 border border-emerald-600 hover:border-emerald-500 bg-emerald-950/40 hover:bg-emerald-950/80 text-emerald-400 hover:text-emerald-200 font-extrabold rounded-lg transition-all text-center cursor-pointer text-[10px] uppercase shadow-md shadow-emerald-950/50">
                            Save
                        </button>
                        <button id="openWavetableLibraryBtn" class="px-2 py-1.5 border border-amber-700 hover:border-amber-600 bg-amber-950/40 hover:bg-amber-950/80 text-amber-400 hover:text-amber-300 font-extrabold rounded-lg transition-all text-center cursor-pointer text-[10px] uppercase shadow-md shadow-amber-950/50">
                            Edit
                        </button>
                    </div>
                </div>
                <div class="p-4 space-y-3 bg-zinc-950/10 flex flex-col justify-center">
                    <span class="text-zinc-400 font-bold uppercase text-[10px] block">File System Export / Import</span>
                    <div class="grid grid-cols-2 gap-2">
                        <button id="exportWavetableBtn" class="px-2 py-1.5 border border-purple-700 hover:border-purple-600 bg-purple-950/40 hover:bg-purple-950/80 text-purple-400 hover:text-purple-300 font-extrabold rounded-lg transition-all text-center cursor-pointer text-[10px] uppercase shadow-md shadow-purple-950/50">
                            ↑ Export WAV
                        </button>
                        <div class="relative">
                            <input type="file" id="wavFileInputTarget" accept=".wav" class="hidden" />
                            <button id="loadWavFileButton" class="w-full px-2 py-1.5 border border-indigo-700 hover:border-indigo-600 bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-400 hover:text-indigo-300 font-extrabold rounded-lg transition-all text-center cursor-pointer text-[10px] uppercase shadow-md shadow-indigo-950/50">
                                ↓ Load WAV
                            </button>
                        </div>
                    </div>
                    <div id="fileWindowControlsContainer" class="grid grid-cols-3 gap-3 border-t border-zinc-800/80 pt-2.5">
                        <div class="space-y-1">
                            <span class="text-zinc-500 font-bold text-[9px] uppercase tracking-wider block">Start Offset (Samples)</span>
                            <div class="flex items-stretch bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                                <input id="fileWindowOffsetInput" type="number" value="0" min="0" step="1" class="flex-1 min-w-0 bg-transparent px-2 text-zinc-200 font-bold font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-xs" />
                                <div class="flex flex-col border-l border-zinc-800 w-6 shrink-0 h-full">
                                    <button id="fileOffsetUpBtn" class="h-1/2 flex items-center justify-center text-[8px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border-b border-zinc-800/60 transition-colors select-none cursor-pointer">▲</button>
                                    <button id="fileOffsetDownBtn" class="h-1/2 flex items-center justify-center text-[8px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors select-none cursor-pointer">▼</button>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <span class="text-zinc-500 font-bold text-[9px] uppercase tracking-wider block">Buffer Window Size</span>
                            <div class="flex items-stretch bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                                <input id="fileWindowSizeInput" type="number" value="256" min="1" step="1" class="flex-1 min-w-0 bg-transparent px-2 text-zinc-200 font-bold font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-xs" />
                                <div class="flex flex-col border-l border-zinc-800 w-6 shrink-0 h-full">
                                    <button id="fileSizeUpBtn" class="h-1/2 flex items-center justify-center text-[8px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border-b border-zinc-800/60 transition-colors select-none cursor-pointer">▲</button>
                                    <button id="fileSizeDownBtn" class="h-1/2 flex items-center justify-center text-[8px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors select-none cursor-pointer">▼</button>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <span class="text-zinc-500 font-bold text-[9px] uppercase tracking-wider block">&nbsp;</span>
                            <button id="convertToSplineBtn" class="w-full mt-1 px-2 py-1.5 border border-pink-700 hover:border-pink-600 bg-pink-950/40 hover:bg-pink-950/80 text-pink-400 hover:text-pink-300 font-extrabold rounded-lg transition-all text-center cursor-pointer text-[10px] uppercase shadow-md shadow-pink-950/50">
                                Convert to Spline
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
