window.StateGeneratorsModule = {
    getActions(state, audioInstance) {
        return {
            addGenerator() {
                audioInstance.init();
                const id = crypto.randomUUID();
                const initialConfig = { id, type: 'sine', isInverted: false, frequency: 200, loudness: 0.25, pan: 0.0, timeShift: 0.0, k: 0.5, pow: 1.0, isMuted: false, effects: [] };
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

            validateAndSync(g) {
                g.frequency = Math.max(20, Math.min(20000, parseFloat(g.frequency) || 200));
                g.loudness = Math.max(0, Math.min(1, parseFloat(g.loudness) || 0));
                g.pan = Math.max(-1, Math.min(1, parseFloat(g.pan) || 0));
                g.timeShift = Math.max(0, Math.min(0.05, parseFloat(g.timeShift) || 0));
                g.k = Math.max(0, Math.min(100, parseFloat(g.k) || 2));
                g.pow = Math.max(0, Math.min(100, parseFloat(g.pow) || 1));
                state.sync(g.id);
            }
        };
    }
};
