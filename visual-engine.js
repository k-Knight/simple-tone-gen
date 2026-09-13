const icons = window.ResourceModule_Icons;

window.VisualEngineModule = {
    init(appStateInstance, audioInstance) {
        this.drawOscilloscope(audioInstance);
    },

    drawOscilloscope(audioInstance) {
        const canvas = document.getElementById('scopeCanvas');
        if (!canvas) { requestAnimationFrame(() => this.drawOscilloscope(audioInstance)); return; }
        const ctx = canvas.getContext('2d');

        const renderLoop = () => {
            requestAnimationFrame(renderLoop);
            if (!canvas) return;
            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#1e1e24'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();

            if (audioInstance.isFlushing) {
                ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
                return;
            }
            if (audioInstance.scopeFrameQueue && audioInstance.scopeFrameQueue.length > 0) {
                if (audioInstance.scopeFrameQueue.length > 2) {
                    audioInstance.latestScopeFrame = audioInstance.scopeFrameQueue[audioInstance.scopeFrameQueue.length - 1];
                    audioInstance.scopeFrameQueue = [];
                } else {
                    audioInstance.latestScopeFrame = audioInstance.scopeFrameQueue.shift();
                }
            }
            if (audioInstance.latestScopeFrame) {
                const dataArray = audioInstance.latestScopeFrame;
                let maxVal = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    let absVal = Math.abs(dataArray[i]);
                    if (absVal > maxVal) maxVal = absVal;
                }
                let visualGain = maxVal > 0.001 ? (0.75 / maxVal) : 1.0;
                if (visualGain > 15) visualGain = 15;

                ctx.strokeStyle = '#38f8e2'; ctx.lineWidth = 2.5;
                ctx.beginPath();
                const displayPoints = dataArray.length;
                const sliceWidth = canvas.width / (displayPoints - 1);
                let x = 0;
                for (let i = 0; i < displayPoints; i++) {
                    const sampleValue = -dataArray[i] * visualGain;
                    let y = canvas.height / 2 + (sampleValue * (canvas.height / 2));
                    if (isNaN(y)) y = canvas.height / 2;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    x += sliceWidth;
                }
                ctx.stroke();
            }
        };
        renderLoop();
    },

    paintDOM(state) {
        const root = document.getElementById('app-root');
        if (!root) return;

        const onMasterInput = (e) => {
            const val = parseFloat(e.currentTarget.value) || 0;
            state.masterVolume = val;
            
            if (audio.worker) {
                const now = audio.ctx.currentTime;
                audio.masterGain.gain.cancelScheduledValues(now);
                audio.masterGain.gain.linearRampToValueAtTime(val, now + 0.005);
            }
            
            any('.master-volume-label-text').run(el => {
                el.textContent = `${Math.round(val * 100)}%`;
            });
        };

        const onMasterChange = () => {
            state.render();
        };

        const content = html`
            <header class="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div class="md:col-span-5">
                        <h1 class="text-2xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent select-none">Simple Tone Generator</h1>
                        <p class="text-sm text-zinc-400 mt-1 select-none">High performance phase-accurate multi-oscillator workspace.</p>
                    </div>
                    
                    <div class="md:col-span-7 flex items-center gap-4 bg-zinc-950/40 p-4 border border-zinc-800/60 rounded-xl">
                        <div class="flex-1 space-y-3">
                            <div class="flex items-center justify-between gap-3 text-xs font-mono">
                                <span class="text-zinc-500 select-none font-bold">MASTER:</span>
                                <div class="flex items-center gap-2 flex-1 justify-end">
                                    <input type="range" min="0" max="1" step="0.01" value="${state.masterVolume}" 
                                           onInput=${onMasterInput}
                                           onChange=${onMasterChange}
                                           class="accent-cyan-500 h-1 w-full max-w-[160px] bg-zinc-800 rounded appearance-none cursor-pointer" />
                                    <span class="master-volume-label-text text-cyan-400 w-10 text-right font-bold">${Math.round(state.masterVolume * 100)}%</span>
                                </div>
                            </div>

                            <div class="border-t border-zinc-800/80 pt-3 flex items-center justify-between gap-3 text-xs font-mono">
                                <span class="text-zinc-500 select-none font-bold">REC FILE:</span>
                                <div class="flex items-center gap-2">
                                    <input type="number" min="1" max="10" value="${state.recordDuration}" 
                                           onInput=${e => { state.recordDuration = parseInt(e.currentTarget.value) || 2; }}
                                           class="w-10 bg-zinc-900 border border-zinc-800 rounded text-center py-1 text-purple-400 font-bold focus:outline-none" />
                                    <span class="text-zinc-500 select-none mr-1">SEC</span>
                                    <button onClick=${() => state.triggerRecord()} 
                                            disabled=${state.isRecording}
                                            class="px-3 py-1.5 text-xs font-bold border rounded-lg uppercase transition-all tracking-wider cursor-pointer ${state.isRecording ? 'bg-rose-950/40 text-rose-400 border-rose-900/50 cursor-not-allowed' : 'bg-purple-950 text-purple-400 border-purple-800 hover:bg-purple-900'}">
                                        ${state.isRecording ? 'REC...' : 'Export WAV'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button onClick=${() => state.addGenerator()} class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-zinc-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer border border-sky-500 uppercase tracking-wide flex items-center gap-1.5 flex-shrink-0 h-10">
                            <div class="flex items-center justify-center">${icons.add.cloneNode(true)}</div> Add Oscillator
                        </button>
                    </div>
                </div>

                <div class="h-32 w-full bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden relative shadow-inner">
                    <canvas id="scopeCanvas" width="800" height="128" class="w-full h-full block"></canvas>
                    <div class="absolute top-2 right-3 text-[9px] font-mono tracking-widest text-zinc-600 select-none uppercase">COMBINED SIGNAL SCOPE</div>
                </div>
            </header>

            <main class="space-y-4">
                ${state.generators.length === 0 ? html`
                    <div class="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs select-none">No active oscillators. Click "Add Oscillator" to start synthesis.</div>
                ` : state.generators.map((gen, idx) => window.ComponentModule_Oscillator.render(gen, idx, state))}
            </main>
        `;

        root.innerHTML = '';
        
        if (Array.isArray(content)) {
            content.flat(Infinity).forEach(node => {
                if (node instanceof Node) root.appendChild(node);
            });
        } else if (content instanceof Node) {
            root.appendChild(content);
        }
    }
};
