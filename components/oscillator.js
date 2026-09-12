window.ComponentModule_Oscillator = {
    render() {
        return `
        <div :key="gen.id" class="space-y-3 bg-zinc-900/30 p-4 border border-zinc-800/60 rounded-2xl relative" :class="gen.isMuted ? 'opacity-40 grayscale-[30%] transition-opacity' : ''">
            <section class="p-6 bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-lg">
                <div class="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
                    <div class="flex flex-wrap items-center gap-4">
                        <span class="text-xs font-mono px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">OSC #<span x-text="index + 1"></span></span>
                        
                        <div class="flex bg-zinc-950 p-1 border border-zinc-800 rounded-xl text-xs">
                            <template x-for="w in waveTypes">
                                <button @click="gen.type = w; sync(gen.id)" :class="gen.type === w ? 'bg-zinc-800 text-cyan-400 border-zinc-700' : 'text-zinc-400 border-transparent'" class="px-2.5 py-1 rounded-lg border capitalize cursor-pointer" x-text="w"></button>
                            </template>
                        </div>
                        
                        <label class="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
                            <input type="checkbox" x-model="gen.isInverted" @change="sync(gen.id)" class="sr-only peer">
                            <div class="w-7 h-4 bg-zinc-800 rounded-full peer peer-checked:bg-cyan-950 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-cyan-400 peer-checked:after:translate-x-3 after:rounded-full after:h-3 after:w-3 after:transition-all border border-zinc-700"></div>
                            <span>Invert Wave</span>
                        </label>

                        <button @click="gen.isMuted = !gen.isMuted; sync(gen.id)" :class="gen.isMuted ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-zinc-950/40 text-zinc-500 border-zinc-800'" class="px-2.5 py-1 text-xs border rounded-lg uppercase tracking-wider font-bold transition-all flex items-center gap-1 cursor-pointer">
                            <div class="w-1.5 h-1.5 rounded-full" :class="gen.isMuted ? 'bg-rose-400 animate-pulse' : 'bg-zinc-700'"></div>
                            Mute
                        </button>
                    </div>
                    <button @click="removeGenerator(gen.id)" class="text-zinc-500 hover:text-rose-400 cursor-pointer">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div x-html="renderKnob('frequency', 'Frequency', 20, 20000, 1, true, 'Hz')"></div>
                    <div x-html="renderKnob('loudness', 'Loudness', 0, 1, 0.01, false, '%')"></div>
                    <div x-html="renderKnob('pan', 'Balance', -1, 1, 0.01, false, 'Bal')"></div>
                    <div x-html="renderKnob('timeShift', 'Time Shift', 0, 0.05, 0.001, false, 'Sec')"></div>
                </div>

                <div class="mt-4 pt-4 border-t border-zinc-800/50">
                    <template x-if="gen.effects.length === 0">
                        <button @click="addEffect(gen.id)" class="px-3 py-1.5 border border-purple-900 bg-purple-950/30 hover:bg-purple-900/40 text-purple-400 text-xs font-bold rounded-xl transition-all uppercase tracking-wide cursor-pointer flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Add Super Effect
                        </button>
                    </template>
                    <template x-for="fx in gen.effects" :key="fx.id">
                        <div class="p-4 bg-zinc-950/40 border border-purple-900/30 rounded-xl space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">Unison Super Modulator</span>
                                <button @click="removeEffect(gen.id, fx.id)" class="text-zinc-500 hover:text-rose-400 cursor-pointer">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div x-html="renderEffectKnob(fx, 'superDetune', 'Detune Width', 0, 20, 0.01, false, 'Hz')"></div>
                                <div x-html="renderEffectKnob(fx, 'superLoudness', 'Unison Gain', 0, 2, 0.01, false, 'Vol')"></div>
                                <div x-html="renderEffectKnob(fx, 'superMode', 'Voice Phase', 0, 2, 1, false, 'Mode')"></div>
                            </div>
                        </div>
                    </template>
                </div>
            </section>
        </div>
        `;
    }
};
