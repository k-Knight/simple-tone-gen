window.ComponentModule_CustomWaveCanvas = {
    render(appStateInstance) {
        if (!appStateInstance.customWaveTable) {
            appStateInstance.customWaveTable = new Float32Array(256);
        }

        const viewSize = 300;
        const totalWidth = viewSize * 3;

        const containerEl = html`
            <section class="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    <div class="lg:col-span-4 space-y-5">
                        <div class="border-b border-zinc-800 pb-3">
                            <h2 class="text-sm font-mono text-cyan-400 font-bold uppercase tracking-wider">Spline Waveform Designer</h2>
                            <p class="text-xs text-zinc-500 mt-1">Left-click and drag nodes. Right-click canvas space to add nodes, or right-click nodes to remove them.</p>
                        </div>

                        <div class="bg-zinc-950/60 p-4 border border-zinc-800/60 rounded-xl space-y-4">
                            <div class="space-y-2">
                                <div class="flex items-center justify-between text-xs font-mono">
                                    <span class="text-zinc-400 font-bold uppercase">Wavetable Size</span>
                                    <span id="waveSizeLabel" class="text-cyan-400 font-bold px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">${appStateInstance.customWaveTable.length}</span>
                                </div>
                                <input id="waveSizeSlider" type="range" min="0" max="8" value="6" 
                                       class="accent-cyan-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer w-full block" />
                            </div>

                            <div class="space-y-2 pt-2 border-t border-zinc-800/60">
                                <div class="flex items-center justify-between text-xs font-mono">
                                    <span class="text-zinc-400 font-bold uppercase">Curve Contiguity</span>
                                    <span id="splineTensionLabel" class="text-amber-400 font-bold px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">Smooth</span>
                                </div>
                                <input id="splineTensionSlider" type="range" min="0" max="100" value="0" 
                                       class="accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer w-full block" />
                            </div>

                            <div class="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs font-mono">
                                <span class="text-zinc-400 font-bold uppercase">Loop Smoothing</span>
                                <label class="flex items-center gap-2 cursor-pointer select-none">
                                    <input id="splineSmoothToggle" type="checkbox" class="sr-only" ${appStateInstance.useSplineSmoothing !== false ? 'checked' : ''} />
                                    <div id="splineSmoothToggleVisual" class="w-8 h-4 bg-zinc-800 rounded-xl relative border border-zinc-700 transition-all flex items-center px-0.5 data-[active=true]:bg-cyan-950/40 data-[active=true]:border-cyan-500/50"
                                         data-active="${appStateInstance.useSplineSmoothing !== false ? 'true' : 'false'}">
                                        <div class="w-2.5 h-2.5 bg-zinc-400 rounded-full transition-all transform data-[active=true]:bg-cyan-400 data-[active=true]:translate-x-3"
                                             data-active="${appStateInstance.useSplineSmoothing !== false ? 'true' : 'false'}"></div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 gap-2">
                            <button id="clearWaveBtn" class="w-full text-left px-3 py-2 text-xs border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 rounded-xl font-bold font-mono uppercase tracking-wide transition-all cursor-pointer">
                                ⌫ Reset Flat Line
                            </button>
                            <button id="normalizeWaveBtn" class="w-full text-left px-3 py-2 text-xs border border-amber-950/60 hover:border-amber-900/60 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 hover:text-amber-300 rounded-xl font-bold font-mono uppercase tracking-wide transition-all cursor-pointer">
                                ⤢ Normalize Nodes
                            </button>
                        </div>
                    </div>

                    <div class="lg:col-span-8 flex flex-col items-center">
                        <div class="relative overflow-hidden border border-zinc-800 rounded-2xl bg-zinc-950 flex justify-center items-center shadow-inner select-none w-full" style="height: ${viewSize}px; max-w: ${viewSize}px;">
                            <div class="flex h-full relative" style="width: ${totalWidth}px;">
                                
                                <div class="h-full bg-zinc-900/10 opacity-20 border-r border-dashed border-zinc-800/40 relative pointer-events-none" style="width: ${viewSize}px;">
                                    <canvas id="waveCanvasLeft" width="${viewSize}" height="${viewSize}" class="absolute top-0 left-0 w-full h-full"></canvas>
                                </div>

                                <div class="h-full bg-zinc-950 relative border-r border-l border-zinc-800/80" style="width: ${viewSize}px;">
                                    <div class="absolute inset-0 pointer-events-none flex flex-col justify-between py-0">
                                        <div class="w-full h-px bg-zinc-900/40 mt-[25%]"></div>
                                        <div class="w-full h-px bg-zinc-900/40 mb-[25%]"></div>
                                    </div>
                                    <div class="absolute inset-0 pointer-events-none flex justify-between px-0">
                                        <div class="h-full w-px bg-zinc-900/40 ml-[25%]"></div>
                                        <div class="h-full w-px bg-zinc-900/40 ml-[50%]"></div>
                                        <div class="h-full w-px bg-zinc-900/40 mr-[25%]"></div>
                                    </div>
                                    <div class="absolute top-1/2 left-0 w-full h-px bg-zinc-800/60 pointer-events-none z-10"></div>
                                    <canvas id="waveCanvasCenter" width="${viewSize}" height="${viewSize}" class="absolute top-0 left-0 w-full h-full z-20"></canvas>
                                </div>

                                <div class="h-full bg-zinc-900/10 opacity-20 border-l border-dashed border-zinc-800/40 relative pointer-events-none" style="width: ${viewSize}px;">
                                    <canvas id="waveCanvasRight" width="${viewSize}" height="${viewSize}" class="absolute top-0 left-0 w-full h-full"></canvas>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </section>
        `;

        window.ComponentModule_CustomWaveInteractions.bind(containerEl, appStateInstance, viewSize);
        return containerEl;
    }
};
