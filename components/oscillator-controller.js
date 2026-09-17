window.ComponentModule_OscillatorController = {
    setWaveTypeUI(cardEl, activeWave) {
        const buttons = cardEl.querySelectorAll('.wave-type-btn');
        buttons.forEach(b => {
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

        if (isMuted) {
            cardEl.classList.add('opacity-40', 'grayscale-[30%]');
        } else {
            cardEl.classList.remove('opacity-40', 'grayscale-[30%]');
        }

        if (btn) btn.setAttribute('data-active', isMuted ? 'true' : 'false');
        if (dot) dot.setAttribute('data-active', isMuted ? 'true' : 'false');
    },

    updateDynamicKnobUI(cardEl, gen, appStateInstance) {
        const knobGrid = cardEl.querySelector('.grid');
        if (!knobGrid) return;

        const existingKnob = knobGrid.querySelector('.knob-k-target');
        const p = appStateInstance.waveProfiles[gen.type];

        if (!p || p.min === p.max) {
            if (existingKnob) existingKnob.remove();
            return;
        }

        const freshKnobNode = window.ComponentModule_Knob.render(
            gen, 'k', 'Modifier', p.min, p.max, p.step, true, 'k', () => appStateInstance.sync(gen.id), 'cyan'
        );
        freshKnobNode.classList.add('knob-k-target');

        if (existingKnob) {
            existingKnob.replaceWith(freshKnobNode);
        } else {
            const powInput = knobGrid.querySelector('input[name="pow"]') || knobGrid.querySelector('input[data-prop="pow"]');
            const powKnob = powInput ? (powInput.closest('.knob-root') || powInput.parentElement) : knobGrid.lastElementChild;

            if (powKnob) {
                knobGrid.insertBefore(freshKnobNode, powKnob);
            } else {
                knobGrid.appendChild(freshKnobNode);
            }
        }

        if (window.ComponentModule_KnobController && window.ComponentModule_KnobController.bind) {
            window.ComponentModule_KnobController.bind(freshKnobNode, gen, 'k', appStateInstance);
        }
    },

    bindInteractions(cardEl, gen, appStateInstance) {
        const waveButtons = cardEl.querySelectorAll('.wave-type-btn');
        waveButtons.forEach(btn => {
            btn.addEventListener('click', e => {
                const wave = e.currentTarget.getAttribute('data-wave');

                appStateInstance.changeWaveType(gen.id, wave);
                this.setWaveTypeUI(cardEl, wave);
                this.updateDynamicKnobUI(cardEl, gen, appStateInstance);
            });
        });

        const invertCheck = cardEl.querySelector('.invert-checkbox');
        if (invertCheck) {
            invertCheck.addEventListener('change', e => {
                gen.isInverted = e.currentTarget.checked;
                appStateInstance.sync(gen.id);
                this.setInvertUI(cardEl, gen.isInverted);
            });
        }

        const muteBtn = cardEl.querySelector('.mute-toggle-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                gen.isMuted = !gen.isMuted;
                appStateInstance.sync(gen.id);
                this.setMuteUI(cardEl, gen.isMuted);
            });
        }

        const removeBtn = cardEl.querySelector('.remove-osc-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => appStateInstance.removeGenerator(gen.id));
        }

        cardEl.addEventListener('effect-added', e => {
            const fxConfig = e.detail;
            const mount = cardEl.querySelector('.effects-display-mount-point');
            if (mount) {
                const subPanel = window.ComponentModule_EffectPanels.render(gen, fxConfig, appStateInstance);
                if (subPanel) mount.appendChild(subPanel);
            }
            const addBtn = cardEl.querySelector(`[data-add-fx="${fxConfig.type}"]`);
            if (addBtn) addBtn.classList.add('hidden');
        });

        cardEl.addEventListener('effect-removed', e => {
            Object.keys(window.EffectRegistry).forEach(key => {
                if (typeof window.EffectRegistry[key] !== 'function' && !gen.effects.some(f => f.type === key)) {
                    const addBtn = cardEl.querySelector(`[data-add-fx="${key}"]`);
                    if (addBtn) addBtn.classList.remove('hidden');
                }
            });
        });
    }
};
