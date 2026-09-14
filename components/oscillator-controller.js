window.ComponentModule_OscillatorController = {
    setWaveTypeUI(cardEl, activeWave) {
        any('.wave-type-btn', cardEl).run(b => {
            const isActive = b.getAttribute('data-wave') === activeWave;
            b.setAttribute('data-active', isActive ? 'true' : 'false');
        });
    },

    setInvertUI(cardEl, isInverted) {
        const wrapper = cardEl.querySelector('.invert-toggle-visual');
        if (wrapper) {
            const activeString = isInverted ? 'true' : 'false';
            wrapper.setAttribute('data-active', activeString);
            
            const ball = wrapper.firstElementChild;
            if (ball) ball.setAttribute('data-active', activeString);
        }
    },

    setMuteUI(cardEl, isMuted) {
        const btn = cardEl.querySelector('.mute-toggle-btn');
        const dot = cardEl.querySelector('.mute-dot');
        const cardSurreal = any(cardEl);

        if (isMuted) {
            cardSurreal.classAdd('opacity-40', 'grayscale-[30%]');
        } else {
            cardSurreal.classRemove('opacity-40', 'grayscale-[30%]');
        }

        if (btn) btn.setAttribute('data-active', isMuted ? 'true' : 'false');
        if (dot) dot.setAttribute('data-active', isMuted ? 'true' : 'false');
    },

    bindInteractions(cardEl, gen, appStateInstance) {
        const cardSurreal = any(cardEl);

        any('.wave-type-btn', cardEl).on('click', e => {
            const wave = e.currentTarget.getAttribute('data-wave');
            gen.type = wave;
            appStateInstance.sync(gen.id);
            this.setWaveTypeUI(cardEl, wave);
        });

        any('.invert-checkbox', cardEl).on('change', e => {
            gen.isInverted = e.currentTarget.checked;
            appStateInstance.sync(gen.id);
            this.setInvertUI(cardEl, gen.isInverted);
        });

        any('.mute-toggle-btn', cardEl).on('click', () => {
            gen.isMuted = !gen.isMuted;
            appStateInstance.sync(gen.id);
            this.setMuteUI(cardEl, gen.isMuted);
        });

        any('.remove-osc-btn', cardEl).on('click', () => appStateInstance.removeGenerator(gen.id));

        cardSurreal.on('effect-added', e => {
            const fxConfig = e.detail;
            const mount = cardEl.querySelector('.effects-display-mount-point');
            if (mount) {
                const subPanel = window.ComponentModule_EffectPanels.render(gen, fxConfig, appStateInstance);
                if (subPanel) mount.appendChild(subPanel);
            }
            any(`[data-add-fx="${fxConfig.type}"]`, cardEl).classAdd('hidden');
        });

        cardSurreal.on('effect-removed', e => {
            Object.keys(window.EffectRegistry).forEach(key => {
                if (typeof window.EffectRegistry[key] !== 'function' && !gen.effects.some(f => f.type === key)) {
                    any(`[data-add-fx="${key}"]`, cardEl).classRemove('hidden');
                }
            });
        });
    }
};
