const audio = new window.AudioEngineModule.AudioEngine();

window.AppModule = {
    container() {
        return {
            generators: [],
            waveTypes: ['sine', 'sawtooth', 'square', 'triangle'],
            masterVolume: 0.5,
            recordDuration: 2, 
            isRecording: false,

            init() {
                this.drawOscilloscope();
                window.addEventListener('record-finished', () => {
                    this.isRecording = false;
                    audio.exportWav();
                });
            },
            updateMaster() { 
                audio.init(); 
                if(audio.worker) {
                    const now = audio.ctx.currentTime;
                    audio.masterGain.gain.cancelScheduledValues(now);
                    audio.masterGain.gain.linearRampToValueAtTime(this.masterVolume, now + 0.005);
                } 
            },
            triggerRecord() {
                if (this.isRecording) return;
                this.isRecording = true;
                audio.startRecording(this.recordDuration);
            },
            drawOscilloscope() {
                const canvas = document.getElementById('scopeCanvas');
                if (!canvas) { requestAnimationFrame(() => this.drawOscilloscope()); return; }
                const ctx = canvas.getContext('2d');
                const dataArray = new Float32Array(2048);

                const render = () => {
                    requestAnimationFrame(render);
                    
                    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                        canvas.width = canvas.clientWidth;
                        canvas.height = canvas.clientHeight;
                    }

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    ctx.strokeStyle = '#1e1e24'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke();

                    if (audio.isFlushing) {
                        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5;
                        ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
                        return;
                    }

                    if (audio.analyser) {
                        audio.analyser.getFloatTimeDomainData(dataArray);

                        let maxVal = 0;
                        for (let i = 0; i < dataArray.length; i++) {
                            let absVal = Math.abs(dataArray[i]);
                            if (absVal > maxVal) maxVal = absVal;
                        }
                        let visualGain = maxVal > 0.001 ? (0.75 / maxVal) : 1.0;
                        if (visualGain > 15) visualGain = 15;

                        const currentGens = this.generators || [];
                        const activeGen = currentGens.find(g => !g.isMuted);
                        const triggerFrequency = activeGen ? parseFloat(activeGen.frequency) : 50;
                        
                        const samplesPerPeriod = 48000 / (triggerFrequency || 50);
                        let totalWindowSamples = Math.round(samplesPerPeriod * 2);
                        
                        if (totalWindowSamples > dataArray.length - 200) {
                            totalWindowSamples = dataArray.length - 200;
                        }
                        if (totalWindowSamples < 64) {
                            totalWindowSamples = 64;
                        }

                        const negativeThreshold = -0.05 * maxVal;
                        const positiveThreshold = 0.05 * maxVal;
                        
                        let lockStartIndex = 0;
                        let state = 0;

                        for (let i = 0; i < dataArray.length - totalWindowSamples; i++) {
                            if (state === 0) {
                                if (dataArray[i] < negativeThreshold) {
                                    state = 1;
                                }
                            } else if (state === 1) {
                                if (dataArray[i] > positiveThreshold) {
                                    lockStartIndex = i;
                                    break;
                                }
                            }
                        }

                        ctx.strokeStyle = '#38f8e2'; ctx.lineWidth = 2.5; 
                        ctx.beginPath();

                        const displayPoints = 800; 
                        const sliceWidth = canvas.width / displayPoints;
                        let x = 0;

                        for (let i = 0; i < displayPoints; i++) {
                            const sampleFraction = i / displayPoints;
                            const exactDataIdx = lockStartIndex + (sampleFraction * totalWindowSamples);

                            const indexBase = Math.floor(exactDataIdx);
                            const indexFrac = exactDataIdx - indexBase;

                            if (indexBase + 1 >= dataArray.length) break;

                            const y1 = dataArray[indexBase];
                            const y2 = dataArray[indexBase + 1];
                            const blendedSample = y1 + indexFrac * (y2 - y1);

                            const sampleValue = blendedSample * visualGain;
                            let y = canvas.height / 2 + (sampleValue * (canvas.height / 2));
                            
                            if (isNaN(y)) y = canvas.height / 2;

                            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                            x += sliceWidth;
                        }
                        ctx.stroke();
                    }
                };
                render();
            },

            renderOscillator() { return window.ComponentModule_Oscillator.render(); },
            renderKnob(k, l, min, max, s, log, u) { return window.ComponentModule_RegularKnob.render(k, l, min, max, s, log, u); },
            renderEffectKnob(fx, k, l, min, max, s, log, u) { return window.ComponentModule_EffectKnob.render(fx, k, l, min, max, s, log, u); },
            addGenerator() {
                audio.init();
                const id = crypto.randomUUID();
                const initialConfig = { id, type: 'sine', isInverted: false, frequency: 50, loudness: 0.25, pan: 0.0, timeShift: 0.0, isMuted: false, effects: [] };
                initialConfig._defaults = Object.assign({}, initialConfig);
                this.generators.push(initialConfig); audio.addGenerator(id); this.sync(id);
            },
            removeGenerator(id) { audio.removeGenerator(id); this.generators = this.generators.filter(g => g.id !== id); },
            addEffect(genId) {
                audio.init(); const target = this.generators.find(g => g.id === genId);
                if (target && target.effects.length === 0) {
                    const fxId = crypto.randomUUID();
                    const fxConfig = { id: fxId, type: 'super', superDetune: 1.5, superLoudness: 0.5, superMode: 0 };
                    fxConfig._defaults = Object.assign({}, fxConfig); target.effects.push(fxConfig); this.sync(genId);
                }
            },
            removeEffect(genId, fxId) { const target = this.generators.find(g => g.id === genId); if (target) { target.effects = target.effects.filter(fx => fx.id !== fxId); this.sync(genId); } },
            sync(id) { 
                const arr = this.generators || window.Alpine.$data(document.getElementById('app-root')).generators; 
                const inst = arr.find(g => g.id === id); 
                if (inst) {
                    audio.updateGenerator(id, inst); 
                }
            },
            validateAndSync(g) {
                g.frequency = Math.max(20, Math.min(20000, parseFloat(g.frequency) || 50));
                g.loudness = Math.max(0, Math.min(1, parseFloat(g.loudness) || 0));
                g.pan = Math.max(-1, Math.min(1, parseFloat(g.pan) || 0));
                g.timeShift = Math.max(0, Math.min(0.05, parseFloat(g.timeShift) || 0));
                this.sync(g.id);
            },
            validateFxAndSync(g, fx) {
                fx.superDetune = Math.max(0, Math.min(1000, parseFloat(fx.superDetune) || 0));
                fx.superLoudness = Math.max(0, Math.min(2, parseFloat(fx.superLoudness) || 0));
                fx.superMode = Math.max(0, Math.min(2, Math.round(parseFloat(fx.superMode)) || 0));
                this.sync(g.id);
            }
        };
    }
};
