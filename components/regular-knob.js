window.ComponentModule_RegularKnob = {
    render(key, label, min, max, step, isLog, unit) {
        return `
        <div class="flex flex-col items-center p-3 bg-zinc-950/20 border border-zinc-800/40 rounded-xl relative group" 
             x-data="knob(gen, '${key}', ${min}, ${max}, ${isLog}, (id) => Alpine.$data(document.getElementById('app-root')).sync(id))" 
             @knob-reset.window="$nextTick()">
            <button @click.stop.prevent="resetKnob($event)" title="Reset to default" class="absolute top-2 left-2 p-1 text-zinc-500 hover:text-cyan-400 bg-zinc-900/50 hover:bg-zinc-800 rounded-md border border-zinc-800 transition-all opacity-40 group-hover:opacity-100 flex items-center justify-center cursor-pointer z-10">
                <svg class="w-3 h-3 transition-transform active:rotate-180 duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
            </button>
            <span class="text-xs text-zinc-400 font-medium mb-2 pl-4 self-stretch text-center select-none">${label}</span>
            <div @mousedown="startDrag" @contextmenu="resetKnob($event)" @touchstart.passive="startDrag" class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center relative cursor-ns-resize shadow-inner select-none">
                <div class="absolute w-0.5 h-2.5 bg-cyan-400 rounded top-0.5 left-1/2 -translate-x-1/2 origin-[center_21px]" :style="'transform: rotate(' + getRotation() + 'deg)'"></div>
                <span class="text-[9px] font-mono text-zinc-500 pointer-events-none">${unit}</span>
            </div>
            <input type="number" min="${min}" max="${max}" step="${step}" 
                   :value="gen.${key}"
                   @keydown.enter.prevent="$el.blur()"
                   @blur="gen.${key} = parseFloat($el.value) || ${min}; Alpine.$data(document.getElementById('app-root')).validateAndSync(gen)"
                   class="w-full mt-2 bg-zinc-900 border border-zinc-800 text-center font-mono text-xs py-0.5 rounded text-cyan-400 focus:outline-none focus:border-cyan-500/50">
        </div>
        `;
    }
};
