window.StateEffectsModule = {
    getActions(state, audioInstance) {
        return {
            addEffect(genId, effectType) {
                audioInstance.init();
                const target = state.generators.find(g => g.id === genId);
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
                state.sync(genId);
                
                any(`[data-osc-id="${genId}"]`).run(el => el.dispatchEvent(new CustomEvent('effect-added', { detail: fxConfig })));
            },

            removeEffect(genId, fxId) {
                const target = state.generators.find(g => g.id === genId);
                if (target) {
                    target.effects = target.effects.filter(fx => fx.id !== fxId);
                    state.sync(genId);
                    any(`[data-fx-id="${fxId}"]`).remove();
                    any(`[data-osc-id="${genId}"]`).run(el => el.dispatchEvent(new CustomEvent('effect-removed', { detail: { fxId } })));
                }
            },

            validateFxAndSync(g, fx) {
                if (fx.type === 'unison') {
                    fx.superDetune = parseFloat(Math.max(0, Math.min(1000, parseFloat(fx.superDetune) || 0)).toFixed(3));
                    fx.superLoudness = parseFloat(Math.max(0, Math.min(2, parseFloat(fx.superLoudness) || 0)).toFixed(2));
                    fx.superMode = Math.max(0, Math.min(2, Math.round(parseFloat(fx.superMode)) || 0));
                } else if (fx.type === 'timespread') {
                    const T = g && g.frequency > 0 ? (1.0 / g.frequency) : 0.05;
                    fx.spreadTime = parseFloat(Math.max(-T, Math.min(T, parseFloat(fx.spreadTime) || 0.0)).toFixed(6));
                    fx.spreadLoudness = parseFloat(Math.max(0, Math.min(2, parseFloat(fx.spreadLoudness) || 0)).toFixed(2));
                    fx.spreadMode = Math.max(0, Math.min(1, Math.round(parseFloat(fx.spreadMode)) || 0));
                }
                state.sync(g.id);
            }
        };
    }
};
