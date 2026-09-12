window.ComponentModule_EffectKnob = {
    render(fx, key, label, min, max, step, isLog, unit) {
        return `
        <div class="flex flex-col items-center p-3 bg-zinc-950/40 border border-zinc-800/40 rounded-xl relative group" 
             x-data="knob(fx, '${key}', ${min}, ${max}, ${isLog}, (id) => Alpine.$data(document.getElementById('app-root')).sync(gen.id))" 
             @knob-reset.window="$nextTick()">
            <button @click.stop.prevent="resetKnob($event)" title="Reset to default" class="absolute top-2 left-2 p-1 text-zinc-500 hover:text-purple-400 bg-zinc-900/50 hover:bg-zinc-800 rounded-md border border-zinc-800 transition-all opacity-40 group-hover:opacity-100 flex items-center justify-center cursor-pointer z-10">
                <svg class="w-3 h-3 transition-transform active:rotate-180 duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
            </button>
            <span class="text-[11px] text-zinc-400 font-medium mb-2 pl-4 self-stretch text-center select-none">${label}</span>
            <div @mousedown="startDrag" @contextmenu="resetKnob($event)" @touchstart.passive="startDrag" class="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center relative cursor-ns-resize shadow-inner select-none flex-shrink-0">
                <div class="absolute w-0.5 h-2 bg-purple-400 rounded top-0.5 left-1/2 -translate-x-1/2 origin-[center_17px]" :style="'transform: rotate(' + getRotation() + 'deg)'"></div>
            </div>
            
            <template x-if="'${key}' === 'superMode'">
                <div class="w-full text-center text-[10px] text-purple-300 font-bold font-mono mt-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded select-none uppercase" x-text="Math.round(fx.${key}) === 0 ? 'Both' : (Math.round(fx.${key}) === 1 ? 'Above' : 'Below')"></div>
            </template>
            <template x-if="'${key}' !== 'superMode'">
                <input type="number" min="${min}" max="${max}" step="${step}" 
                       :value="fx.${key}"
                       @keydown.enter.prevent="$el.blur()"
                       @blur="fx.${key} = parseFloat($el.value) || ${min}; Alpine.$data(document.getElementById('app-root')).validateFxAndSync(gen, fx)"
                       class="w-full mt-2 bg-zinc-900 border border-zinc-800 text-center font-mono text-xs py-0.5 rounded text-purple-400 focus:outline-none focus:border-purple-500/50">
            </template>
        </div>
        `;
    }
};
