window.StateGeneratorsModule = {
    getActions(state, audioInstance) {
        return this.create(state, audioInstance);
    },

    create(state, audioInstance) {
        return {
            addGenerator() {
                audioInstance.init();
                const id = crypto.randomUUID();
                
                const waveHistoryK = {};
                if (state.waveProfiles) {
                    Object.keys(state.waveProfiles).forEach(type => {
                        waveHistoryK[type] = state.waveProfiles[type].default;
                    });
                }

                const initialConfig = { 
                    id, 
                    type: 'sine', 
                    isInverted: false, 
                    frequency: 200, 
                    loudness: 0.25, 
                    pan: 0.0, 
                    timeShift: 0.0, 
                    k: 0,
                    waveHistoryK,
                    pow: 1.0, 
                    isMuted: false, 
                    effects: [] 
                };
                
                initialConfig._defaults = Object.assign({}, initialConfig);
                state.generators.push(initialConfig);
                audioInstance.addGenerator(id);
                state.sync(id);

                const container = document.getElementById('oscillatorListContainer');
                if (container) {
                    const node = window.ComponentModule_Oscillator.render(initialConfig, state.generators.length - 1, state);
                    container.appendChild(node);
                }
                any('#emptyStatePlaceholder').classAdd('hidden');
            },

            removeGenerator(id) {
                audioInstance.removeGenerator(id);
                state.generators = state.generators.filter(g => g.id !== id);

                any(`[data-osc-id="${id}"]`).remove();
                if (state.generators.length === 0) {
                    any('#emptyStatePlaceholder').classRemove('hidden');
                }
            },

            changeWaveType(id, newType) {
                const g = state.generators.find(x => x.id === id);
                if (!g || g.type === newType) return;

                g.waveHistoryK[g.type] = g.k;
                g.type = newType;
                g.k = g.waveHistoryK[newType] !== undefined ? g.waveHistoryK[newType] : state.waveProfiles[newType].default;
                g.mustSnapK = true;

                this.validateAndSync(g);
            },

            validateAndSync(g) {
                g.frequency = Math.max(20, Math.min(20000, parseFloat(g.frequency) || 200));
                g.loudness = Math.max(0, Math.min(1, parseFloat(g.loudness) || 0));
                g.pan = Math.max(-1, Math.min(1, parseFloat(g.pan) || 0));
                g.timeShift = Math.max(0, Math.min(0.05, parseFloat(g.timeShift) || 0));
                g.pow = Math.max(0.01, Math.min(100, parseFloat(g.pow) || 1));

                if (state.waveProfiles && state.waveProfiles[g.type]) {
                    const profile = state.waveProfiles[g.type];
                    g.k = Math.max(profile.min, Math.min(profile.max, parseFloat(g.k) !== undefined ? parseFloat(g.k) : profile.default));
                } else {
                    g.k = Math.max(0, Math.min(100, parseFloat(g.k) || 0));
                }

                state.sync(g.id);
            }
        };
    }
};
