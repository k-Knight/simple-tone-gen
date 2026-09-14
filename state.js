window.AppStateModule = {
    create(audioInstance) {
        return {
            generators: [],
            waveTypes: ['sine', 'sawtooth', 'square', 'triangle'],
            masterVolume: 0.5,
            recordDuration: 2,
            isRecording: false,

            init() {
                window.addEventListener('record-finished', () => {
                    this.isRecording = false;
                    audioInstance.exportWav();
                    window.VisualEngineModule.paintDOM(this);
                });
                window.VisualEngineModule.init(this, audioInstance);
            },

            triggerRecord() {
                if (this.isRecording) return;
                this.isRecording = true;
                audioInstance.startRecording(this.recordDuration);
                window.VisualEngineModule.paintDOM(this);
            },

            addGenerator() {
                audioInstance.init();
                const id = crypto.randomUUID();
                const initialConfig = { id, type: 'sine', isInverted: false, frequency: 200, loudness: 0.25, pan: 0.0, timeShift: 0.0, isMuted: false, effects: [] };
                initialConfig._defaults = Object.assign({}, initialConfig);
                this.generators.push(initialConfig);
                audioInstance.addGenerator(id);
                this.sync(id);
                
                // Append instead of sweeping everything
                window.VisualEngineModule.appendOscillatorNode(initialConfig, this.generators.length - 1);
            },

            removeGenerator(id) {
                audioInstance.removeGenerator(id);
                this.generators = this.generators.filter(g => g.id !== id);
                
                // Extract instead of running structural re-render
                window.VisualEngineModule.removeOscillatorNode(id);
            },

            addEffect(genId, effectType) {
                audioInstance.init();
                const target = this.generators.find(g => g.id === genId);
                if (!target || target.effects.some(fx => fx.type === effectType)) return;

                const fxId = crypto.randomUUID();
                let fxConfig = {};

                if (effectType === 'unison') {
                    fxConfig = { id: fxId, type: 'unison', superDetune: 1.5, superLoudness: 0.75, superMode: 0 };
                } else if (effectType === 'timespread') {
                    fxConfig = { id: fxId, type: 'timespread', spreadTime: 0.0, spreadLoudness: 0.75, spreadMode: 0 };
                }

                fxConfig._defaults = Object.assign({}, fxConfig);
                target.effects.push(fxConfig);
                this.sync(genId);
                
                // Tell the specific oscillator container to draw its newly added sub-effect panel
                any(`[data-osc-id="${genId}"]`).run(el => el.dispatchEvent(new CustomEvent('effect-added', { detail: fxConfig })));
            },

            removeEffect(genId, fxId) {
                const target = this.generators.find(g => g.id === genId);
                if (target) {
                    target.effects = target.effects.filter(fx => fx.id !== fxId);
                    this.sync(genId);
                    any(`[data-fx-id="${fxId}"]`).remove();
                    any(`[data-osc-id="${genId}"]`).run(el => el.dispatchEvent(new CustomEvent('effect-removed', { detail: { fxId } })));
                }
            },

            sync(id) {
                const inst = this.generators.find(g => g.id === id);
                if (inst) audioInstance.updateGenerator(id, inst);
            },

            validateAndSync(g) {
                g.frequency = Math.max(20, Math.min(20000, parseFloat(g.frequency) || 50));
                g.loudness = Math.max(0, Math.min(1, parseFloat(g.loudness) || 0));
                g.pan = Math.max(-1, Math.min(1, parseFloat(g.pan) || 0));
                g.timeShift = Math.max(0, Math.min(0.05, parseFloat(g.timeShift) || 0));
                this.sync(g.id);
            },

            validateFxAndSync(g, fx) {
                if (fx.type === 'unison') {
                    let rawDetune = Math.max(0, Math.min(1000, parseFloat(fx.superDetune) || 0));
                    fx.superDetune = parseFloat(rawDetune.toFixed(3));
                    let rawLoudness = Math.max(0, Math.min(2, parseFloat(fx.superLoudness) || 0));
                    fx.superLoudness = parseFloat(rawLoudness.toFixed(2));
                    fx.superMode = Math.max(0, Math.min(2, Math.round(parseFloat(fx.superMode)) || 0));
                } else if (fx.type === 'timespread') {
                    const T = g && g.frequency > 0 ? (1.0 / g.frequency) : 0.05;
                    let rawSpread = Math.max(-T, Math.min(T, parseFloat(fx.spreadTime) || 0.0));
                    fx.spreadTime = parseFloat(rawSpread.toFixed(6));
                    let rawLoudness = Math.max(0, Math.min(2, parseFloat(fx.spreadLoudness) || 0));
                    fx.spreadLoudness = parseFloat(rawLoudness.toFixed(2));
                    fx.spreadMode = Math.max(0, Math.min(1, Math.round(parseFloat(fx.spreadMode)) || 0));
                }
                this.sync(g.id);
            }
        };
    }
};