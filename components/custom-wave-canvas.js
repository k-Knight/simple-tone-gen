window.ComponentModule_CustomWaveCanvas = {
    render(appStateInstance) {
        if (!appStateInstance.customWaveTable) {
            appStateInstance.customWaveTable = new Float32Array(1024);
            for (let i = 0; i < 1024; i++) {
                appStateInstance.customWaveTable[i] = Math.sin((i / 1024) * Math.PI * 2);
            }
        }

        const viewSize = 300;
        const totalWidth = viewSize * 3;

        const containerEl = html`
            <section class="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-sm font-mono text-cyan-400 font-bold uppercase tracking-wider">Custom Waveform Designer</h2>
                        <p class="text-xs text-zinc-400 mt-0.5">Click and drag inside the center grid to shape your curve.</p>
                    </div>
                    <div class="flex gap-2">
                        <button id="clearWaveBtn" class="px-2.5 py-1 text-xs border border-zinc-700/60 hover:border-zinc-500 rounded-lg font-bold bg-zinc-950/40 text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer">
                            Clear
                        </button>
                        <button id="normalizeWaveBtn" class="px-2.5 py-1 text-xs border border-amber-900/60 hover:border-amber-700 bg-amber-950/30 text-amber-400 hover:text-amber-300 rounded-lg font-bold transition-all cursor-pointer">
                            Normalize Peak
                        </button>
                        <button id="smoothWaveBtn" class="px-2.5 py-1 text-xs border border-cyan-900/60 hover:border-cyan-700 bg-cyan-950/30 text-cyan-400 hover:text-cyan-300 rounded-lg font-bold transition-all cursor-pointer">
                            Smooth
                        </button>
                    </div>
                </div>

                <div class="relative overflow-hidden border border-zinc-800 rounded-xl bg-zinc-950 flex justify-center items-center shadow-inner select-none" style="height: ${viewSize}px;">
                    <div class="flex h-full relative" style="width: ${totalWidth}px;">
                        
                        <!-- Left repeated context pane -->
                        <div class="h-full bg-zinc-900/10 opacity-30 border-r border-dashed border-zinc-800/40 relative pointer-events-none" style="width: ${viewSize}px;">
                            <canvas id="waveCanvasLeft" width="${viewSize}" height="${viewSize}" class="absolute top-0 left-0 w-full h-full"></canvas>
                        </div>

                        <!-- Active Central designer pane -->
                        <div class="h-full bg-zinc-950 relative border-r border-l border-zinc-800/80 cursor-crosshair" style="width: ${viewSize}px;">
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

                        <!-- Right repeated context pane -->
                        <div class="h-full bg-zinc-900/10 opacity-30 border-l border-dashed border-zinc-800/40 relative pointer-events-none" style="width: ${viewSize}px;">
                            <canvas id="waveCanvasRight" width="${viewSize}" height="${viewSize}" class="absolute top-0 left-0 w-full h-full"></canvas>
                        </div>

                    </div>
                </div>

                <div class="bg-zinc-950 border border-zinc-800/60 p-3 rounded-lg font-mono text-[10px] space-y-1.5">
                    <div class="text-zinc-500 font-bold uppercase tracking-wider flex justify-between">
                        <span>Wave Lookup Table Sample (1024 Array Points)</span>
                        <span class="text-cyan-500" id="drawStatusLabel">Idle</span>
                    </div>
                    <div id="tableDataPreview" class="text-zinc-400 grid grid-cols-8 gap-x-2 gap-y-0.5 max-h-16 overflow-y-auto pr-1 scrollbar-thin"></div>
                </div>
            </section>
        `;

        // Pass rendering elements down to interactions binder
        window.ComponentModule_CustomWaveInteractions.bind(containerEl, appStateInstance, viewSize);
        return containerEl;
    }
};
