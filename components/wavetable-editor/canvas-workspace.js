window.ComponentModule_CustomWaveCanvasWorkspace = {
    render(localContext, viewSize) {
        return html`
            <div class="grid grid-cols-1 md:grid-cols-12 bg-zinc-900/40">
                <div class="md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-zinc-800 space-y-4 flex flex-col justify-between bg-zinc-900/10">
                    <div class="space-y-4">
                        <span class="text-zinc-500 font-bold uppercase text-[10px] block border-b border-zinc-800/60 pb-1.5">Interactive Controls:</span>
                        <div class="space-y-3.5">
                            <div class="space-y-1.5">
                                <div class="flex items-center justify-between">
                                    <span class="text-zinc-400 uppercase text-[11px]">Wavetable Size</span>
                                    <span id="waveSizeLabel" class="text-cyan-400 font-bold px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[10px]">${localContext.customWaveTable.length}</span>
                                </div>
                                <input id="waveSizeSlider" type="range" min="0" max="8" value="6" class="accent-cyan-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer w-full block" />
                            </div>
                            <div class="space-y-1.5">
                                <div class="flex items-center justify-between">
                                    <span class="text-zinc-400 uppercase text-[11px]">Curve Contiguity</span>
                                    <span id="splineTensionLabel" class="text-amber-400 font-bold px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[10px]">Smooth</span>
                                </div>
                                <input id="splineTensionSlider" type="range" min="0" max="100" value="0" class="accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer w-full block" />
                            </div>
                            <div class="flex items-center justify-between pt-1 text-[11px]">
                                <span class="text-zinc-400 uppercase">Loop Smoothing</span>
                                <label class="flex items-center gap-2 cursor-pointer select-none">
                                    <input id="splineSmoothToggle" type="checkbox" class="sr-only" checked />
                                    <div id="splineSmoothToggleVisual" class="w-7 h-4 bg-zinc-950 rounded-xl relative border border-zinc-800 transition-all flex items-center p-0.5 data-[active=true]:bg-cyan-950/40 data-[active=true]:border-cyan-500/50" data-active="true">
                                        <div class="w-2.5 h-2.5 bg-zinc-400 rounded-full transition-all transform data-[active=true]:bg-cyan-400 data-[active=true]:translate-x-3 data-[active=false]:translate-x-0" data-active="true"></div>
                                    </div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between pt-1 text-[11px]">
                                <span class="text-zinc-400 uppercase">Lock Ends Together</span>
                                <label class="flex items-center gap-2 cursor-pointer select-none">
                                    <input id="lockEndsTogetherToggle" type="checkbox" class="sr-only" />
                                    <div id="lockEndsTogetherToggleVisual" class="w-7 h-4 bg-zinc-950 rounded-xl relative border border-zinc-800 transition-all flex items-center p-0.5 data-[active=true]:bg-cyan-950/40 data-[active=true]:border-cyan-500/50" data-active="false">
                                        <div class="w-2.5 h-2.5 bg-zinc-400 rounded-full transition-all transform data-[active=true]:bg-cyan-400 data-[active=true]:translate-x-3 data-[active=false]:translate-x-0" data-active="false"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/40">
                        <button id="snapEdgesBtn" class="px-2 py-1.5 border border-amber-950/80 hover:border-amber-700 bg-rose-950/20 hover:bg-amber-950/50 text-amber-400 hover:text-amber-300 rounded-lg font-bold transition-all text-center cursor-pointer text-[10px] uppercase shadow-sm">
                            Zero Wave Edges
                        </button>
                        <button id="fullStretchBtn" class="px-2 py-1.5 border border-cyan-950/80 hover:border-cyan-700 bg-cyan-950/20 hover:bg-cyan-950/50 text-cyan-400 hover:text-cyan-300 rounded-lg font-bold transition-all text-center cursor-pointer text-[10px] uppercase shadow-sm">
                            ↕ Min-Max Stretch
                        </button>
                        <button id="clearWaveBtn" class="px-2 py-1.5 border border-rose-950/80 hover:border-rose-700 bg-rose-950/20 hover:bg-red-950/50 text-rose-400 hover:text-rose-300 rounded-lg font-bold transition-all text-center cursor-pointer text-[10px] uppercase shadow-sm">
                            ⌫ Clear
                        </button>
                        <button id="normalizeWaveBtn" class="px-2 py-1.5 border border-emerald-950/80 hover:border-emerald-700 bg-emerald-950/20 hover:bg-emerald-950/50 text-emerald-400 hover:text-emerald-300 rounded-lg font-bold transition-all text-center cursor-pointer text-[10px] uppercase shadow-sm">
                            ⤢ Normalize
                        </button>
                    </div>
                </div>

                <div class="md:col-span-8 bg-zinc-950/20 flex items-stretch justify-center p-4 self-stretch">
                    <div class="border border-zinc-800 rounded-xl bg-zinc-950 flex shadow-inner select-none w-full h-full min-h-[400px]">
                        <div class="flex-1 bg-zinc-900/10 opacity-20 border-r border-dashed border-zinc-800/40 relative pointer-events-none">
                            <canvas id="waveCanvasLeft" class="absolute inset-0 w-full h-full object-stretch"></canvas>
                        </div>
                        <div class="flex-[3] bg-zinc-950 relative border-r border-l border-zinc-800/80 cursor-crosshair">
                            <div class="absolute inset-0 pointer-events-none flex flex-col justify-between py-0">
                                <div class="w-full h-px bg-zinc-900/30 mt-[25%]"></div>
                                <div class="w-full h-px bg-zinc-900/30 mb-[25%]"></div>
                            </div>
                            <div class="absolute inset-0 pointer-events-none flex justify-between px-0">
                                <div class="h-full w-px bg-zinc-900/30 ml-[25%]"></div>
                                <div class="h-full w-px bg-zinc-900/30 ml-[50%]"></div>
                                <div class="h-full w-px bg-zinc-900/30 mr-[25%]"></div>
                            </div>
                            <div class="absolute top-1/2 left-0 w-full h-px bg-zinc-800/50 pointer-events-none z-10"></div>
                            <canvas id="waveCanvasCenter" class="absolute inset-0 w-full h-full z-20"></canvas>
                        </div>
                        <div class="flex-1 bg-zinc-900/10 opacity-20 border-l border-dashed border-zinc-800/40 relative pointer-events-none">
                            <canvas id="waveCanvasRight" class="absolute inset-0 w-full h-full object-stretch"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
