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

        if (gen.type === 'wavetable' || !p || p.min === p.max) {
            if (existingKnob) {
                existingKnob.classList.add('opacity-25', 'pointer-events-none');
                const numericInput = existingKnob.querySelector('.knob-numeric-input');
                if (numericInput) numericInput.disabled = true;
            }
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

                if (wave === 'wavetable') {
                    const savedKeys = Object.keys(appStateInstance.customWavetables || {});
                    
                    if (savedKeys.length === 0) {
                        alert("No saved custom wavetables found. Please build and save one inside the Custom Wave Designer first!");
                        return;
                    }

                    const modalSelectorOverlay = html`
                        <div class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4 font-mono text-xs">
                            <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full space-y-4">
                                <div class="text-cyan-400 font-bold uppercase tracking-wider text-center border-b border-zinc-800 pb-2">Select Target Wavetable</div>
                                <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                    ${savedKeys.map(k => {
                                        const record = appStateInstance.customWavetables[k];
                                        const typeTag = record['editor-state'] ? 'Spline' : 'Raw File';
                                        return html`
                                            <button class="w-full flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 hover:border-cyan-500 rounded text-left text-zinc-300 hover:text-zinc-100 font-bold transition-all cursor-pointer">
                                                <span>📁 ${k}</span>
                                                <span class="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded">
                                                    ${typeTag}
                                                </span>
                                            </button>
                                        `;
                                    })}
                                </div>
                                <button class="w-full py-1.5 bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg cursor-pointer text-center uppercase text-[10px]">Cancel</button>
                            </div>
                        </div>
                    `;

                    document.body.appendChild(modalSelectorOverlay);

                    const rowButtons = modalSelectorOverlay.querySelectorAll('div > button');
                    rowButtons.forEach((btnElem, bIdx) => {
                        btnElem.addEventListener('click', () => {
                            const selectedName = savedKeys[bIdx];
                            
                            gen.type = 'wavetable';
                            gen.selectedWavetable = selectedName;

                            appStateInstance.validateAndSync(gen);

                            this.setWaveTypeUI(cardEl, 'wavetable');
                            this.updateDynamicKnobUI(cardEl, gen, appStateInstance);
                            
                            if (window.audio) window.audio.restartSimulation();
                            modalSelectorOverlay.remove();
                        });
                    });

                    modalSelectorOverlay.querySelector('button:last-child').addEventListener('click', () => {
                        modalSelectorOverlay.remove();
                    });

                    return;
                }

                if (typeof appStateInstance.changeWaveType === 'function' && !btn.classList.contains('sub-wave-btn')) {
                    appStateInstance.changeWaveType(gen.id, wave);
                } else {
                    gen.type = wave;
                    appStateInstance.sync(gen.id);
                }

                this.setWaveTypeUI(cardEl, wave);
                this.updateDynamicKnobUI(cardEl, gen, appStateInstance);
                if (window.audio) window.audio.restartSimulation();
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
