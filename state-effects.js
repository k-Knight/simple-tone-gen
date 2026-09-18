window.StateEffectsModule = {
    getActions(state, audioInstance) {
        return {
            addEffect(genId, effectType) {
                audioInstance.init();
                const target = state.generators.find(g => g.id === genId);
                const plugin = window.EffectRegistry.get(effectType);
                if (!target || !plugin || target.effects.some(fx => fx.type === effectType)) return;

                const fxId = crypto.randomUUID();
                const fxConfig = plugin.getDefaults(fxId);
                fxConfig._defaults = Object.assign({}, fxConfig);

                target.effects.push(fxConfig);
                state.sync(genId);

                any(`[data-osc-id="${genId}"]`).run(el => el.dispatchEvent(new CustomEvent('effect-added', { detail: fxConfig })));

                window.audio.restartSimulation();
            },

            removeEffect(genId, fxId) {
                const target = state.generators.find(g => g.id === genId);
                if (target) {
                    target.effects = target.effects.filter(fx => fx.id !== fxId);
                    state.sync(genId);
                    any(`[data-fx-id="${fxId}"]`).remove();
                    any(`[data-osc-id="${genId}"]`).run(el => el.dispatchEvent(new CustomEvent('effect-removed', { detail: { fxId } })));
                }

                window.audio.restartSimulation();
            },

            validateFxAndSync(g, fx) {
                const plugin = window.EffectRegistry.get(fx.type);
                if (plugin) {
                    if (fx.type === 'timespread') plugin.validate(g, fx);
                    else plugin.validate(fx);
                }
                state.sync(g.id);
            }
        };
    }
};
