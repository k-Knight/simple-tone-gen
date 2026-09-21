window.ComponentModule_CustomWaveInteractions = {
    bind(containerEl, standaloneContext, size, globalCustomWavetables) {
        const ctrl = window.ComponentModule_CustomWaveController;
        const uiLock = window.ComponentModule_CustomWaveInteractionsUILock;
        const fileLoader = window.ComponentModule_CustomWaveInteractionsFileLoader;
        const ev = window.ComponentModule_CustomWaveInteractionsEvents;

        const elements = {
            centerCanvas: me('#waveCanvasCenter', containerEl),
            leftCanvas: me('#waveCanvasLeft', containerEl),
            rightCanvas: me('#waveCanvasRight', containerEl),
            sizeSlider: me('#waveSizeSlider', containerEl),
            sizeLabel: me('#waveSizeLabel', containerEl),
            tensionSlider: me('#splineTensionSlider', containerEl),
            tensionLabel: me('#splineTensionLabel', containerEl),
            smoothToggle: me('#splineSmoothToggle', containerEl),
            smoothToggleVisual: me('#splineSmoothToggleVisual', containerEl),
            endsToggle: me('#lockEndsTogetherToggle', containerEl),
            endsToggleVisual: me('#lockEndsTogetherToggleVisual', containerEl),
            fileInput: me('#wavFileInputTarget', containerEl),
            fileBtn: me('#loadWavFileButton', containerEl),
            snapEdgesBtn: me('#snapEdgesBtn', containerEl),
            nameInput: me('#wavetableNameInput', containerEl)
        };

        const sizes = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
        standaloneContext.activeDragNode = null;

        const triggerSimulationReset = () => {
            if (window.audio && typeof window.audio.restartSimulation === 'function') {
                window.audio.restartSimulation();
            }
        };

        if (standaloneContext.customWaveTable && elements.sizeSlider) {
            const currentLen = standaloneContext.customWaveTable.length;
            const sizeIdx = sizes.indexOf(currentLen);
            if (sizeIdx !== -1) {
                elements.sizeSlider.value = sizeIdx;
                if (elements.sizeLabel) elements.sizeLabel.textContent = String(currentLen);
            }
        }

        standaloneContext.pendingOverwriteNameKey = null;

        me('#saveWavetableBtn', containerEl).on('click', () => {
            const nameKey = elements.nameInput ? elements.nameInput.value.trim() : "Custom Wavetable";
            if (!nameKey) return;

            const executeCommitSave = () => {
                const wavetablePayload = {
                    values: Array.from(standaloneContext.customWaveTable)
                };

                if (standaloneContext.importMode === 'spline') {
                    wavetablePayload['editor-state'] = {
                        splineTension: standaloneContext.splineTension,
                        useSplineSmoothing: standaloneContext.useSplineSmoothing,
                        lockEndsTogether: standaloneContext.lockEndsTogether,
                        splineNodes: JSON.parse(JSON.stringify(standaloneContext.splineNodes))
                    };
                }

                if (globalCustomWavetables) {
                    globalCustomWavetables[nameKey] = wavetablePayload;
                }

                window.dispatchEvent(new CustomEvent('wavetable-registry-updated', { detail: { name: nameKey } }));

                if (me('#closeWaveEditorBtn', containerEl)) {
                    me('#closeWaveEditorBtn', containerEl).click();
                }
            };

            if (globalCustomWavetables && globalCustomWavetables[nameKey]) {
                const confirmPopup = me('#wavetableOverwriteConfirmPopup', containerEl);
                const targetText = me('#overwriteTargetNameDisplay', containerEl);
                
                if (confirmPopup && targetText) {
                    standaloneContext.pendingOverwriteNameKey = nameKey;
                    targetText.textContent = `"${nameKey}"`;
                    confirmPopup.classList.remove('hidden');
                }
            } else {
                executeCommitSave();
            }
        });

        const confirmBtn = me('#confirmOverwriteBtn', containerEl);
        if (confirmBtn) {
            me(confirmBtn).on('click', () => {
                const nameKey = standaloneContext.pendingOverwriteNameKey;
                if (!nameKey) return;

                const wavetablePayload = {
                    values: Array.from(standaloneContext.customWaveTable)
                };

                if (standaloneContext.importMode === 'spline') {
                    wavetablePayload['editor-state'] = {
                        splineTension: standaloneContext.splineTension,
                        useSplineSmoothing: standaloneContext.useSplineSmoothing,
                        lockEndsTogether: standaloneContext.lockEndsTogether,
                        splineNodes: JSON.parse(JSON.stringify(standaloneContext.splineNodes))
                    };
                }

                if (globalCustomWavetables) {
                    globalCustomWavetables[nameKey] = wavetablePayload;
                }

                window.dispatchEvent(new CustomEvent('wavetable-registry-updated', { detail: { name: nameKey } }));
                
                standaloneContext.pendingOverwriteNameKey = null;
                me('#wavetableOverwriteConfirmPopup', containerEl).classList.add('hidden');

                if (me('#closeWaveEditorBtn', containerEl)) {
                    me('#closeWaveEditorBtn', containerEl).click();
                }
            });
        }

        const cancelBtn = me('#cancelOverwriteBtn', containerEl);
        if (cancelBtn) {
            me(cancelBtn).on('click', () => {
                standaloneContext.pendingOverwriteNameKey = null;
                me('#wavetableOverwriteConfirmPopup', containerEl).classList.add('hidden');
            });
        }

        me('#convertToSplineBtn', containerEl).on('click', () => {
            if (standaloneContext.importMode !== 'file' || !standaloneContext.customWaveTable) return;

            const audioSamples = standaloneContext.customWaveTable;
            const totalSamples = audioSamples.length;
            if (totalSamples === 0) return;

            const convertedNodes = [];
            for (let i = 0; i < totalSamples; i++) {
                const pctX = i / (totalSamples - 1);
                const rawY = audioSamples[i];

                const boundedY = Math.max(-1.0, Math.min(1.0, rawY));

                convertedNodes.push({
                    id: crypto.randomUUID(),
                    x: pctX,
                    y: boundedY,
                    isFixed: (i === 0 || i === totalSamples - 1)
                });
            }

            standaloneContext.importMode = 'spline';
            standaloneContext.splineNodes = convertedNodes;
            standaloneContext.splineTension = 1.0; 
            standaloneContext.useSplineSmoothing = false; 
            standaloneContext.lockEndsTogether = false; 

            const maxPossibleSizeIndex = sizes.length - 1;
            const maxTargetSamples = sizes[maxPossibleSizeIndex];
            
            if (elements.sizeSlider) {
                elements.sizeSlider.value = maxPossibleSizeIndex;
            }
            if (elements.sizeLabel) {
                elements.sizeLabel.textContent = String(maxTargetSamples);
            }

            ctrl.resizeWaveTable(standaloneContext, maxTargetSamples);

            if (elements.tensionSlider) {
                elements.tensionSlider.value = 100;
                if (elements.tensionLabel) elements.tensionLabel.textContent = "Linear";
            }
            if (elements.smoothToggleVisual) {
                elements.smoothToggleVisual.setAttribute('data-active', 'false');
                if (elements.smoothToggleVisual.firstElementChild) {
                    elements.smoothToggleVisual.firstElementChild.setAttribute('data-active', 'false');
                }
            }
            if (elements.endsToggleVisual) {
                elements.endsToggleVisual.setAttribute('data-active', 'false');
                if (elements.endsToggleVisual.firstElementChild) {
                    elements.endsToggleVisual.firstElementChild.setAttribute('data-active', 'false');
                }
            }
            if (elements.smoothToggle) elements.smoothToggle.checked = false;
            if (elements.endsToggle) elements.endsToggle.checked = false;

            uiLock.refresh(standaloneContext, elements);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();

            console.log(`Successfully vectorized ${totalSamples} samples straight into editable spline dots.`);
        });

        ev.bindSliders(standaloneContext, elements, ctrl, size);
        ev.bindCanvasMouse(standaloneContext, elements, ctrl, size, triggerSimulationReset);
        fileLoader.bind(standaloneContext, elements, size, ctrl, triggerSimulationReset, uiLock.refresh);

        if (elements.sizeSlider) {
            me(elements.sizeSlider).on('input', e => {
                const nextSize = sizes[parseInt(e.target.value) || 0];
                if (elements.sizeLabel) elements.sizeLabel.textContent = String(nextSize);
                ctrl.resizeWaveTable(standaloneContext, nextSize);
                ctrl.updateAllCanvases(standaloneContext, size, elements);
                triggerSimulationReset();
            });
        }

        const editorModal = containerEl.first || containerEl;

        if (me('#closeWaveEditorBtn', containerEl)) {
            me('#closeWaveEditorBtn', containerEl).on('click', () => {
                editorModal.classList.add('hidden');
                const freshDefaults = window.ComponentModule_CustomWaveDefaultState();

                Object.assign(standaloneContext, freshDefaults);
                standaloneContext.customWaveTable = freshDefaults.customWaveTable;
                standaloneContext.splineNodes = freshDefaults.splineNodes;

                if (elements.sizeSlider && standaloneContext.customWaveTable) {
                    const currentLen = standaloneContext.customWaveTable.length;
                    const sizeIdx = sizes.indexOf(currentLen);
                    if (sizeIdx !== -1) elements.sizeSlider.value = sizeIdx;
                    if (elements.sizeLabel) elements.sizeLabel.textContent = String(currentLen);
                }

                if (elements.tensionSlider) {
                    elements.tensionSlider.value = freshDefaults.splineTension * 100;
                    if (elements.tensionLabel) {
                        elements.tensionLabel.textContent = freshDefaults.splineTension === 0 ? "Smooth" : (freshDefaults.splineTension === 1 ? "Linear" : Math.round(freshDefaults.splineTension * 100) + "%");
                    }
                }

                if (elements.smoothToggle) {
                    elements.smoothToggle.checked = freshDefaults.useSplineSmoothing;
                    if (elements.smoothToggleVisual) {
                        const smoothStr = String(freshDefaults.useSplineSmoothing);
                        elements.smoothToggleVisual.setAttribute('data-active', smoothStr);
                        if (elements.smoothToggleVisual.firstElementChild) {
                            elements.smoothToggleVisual.firstElementChild.setAttribute('data-active', smoothStr);
                        }
                    }
                }

                if (elements.endsToggle) {
                    elements.endsToggle.checked = freshDefaults.lockEndsTogether;
                    if (elements.endsToggleVisual) {
                        const endsStr = String(freshDefaults.lockEndsTogether);
                        elements.endsToggleVisual.setAttribute('data-active', endsStr);
                        if (elements.endsToggleVisual.firstElementChild) {
                            elements.endsToggleVisual.firstElementChild.setAttribute('data-active', endsStr);
                        }
                    }
                }

                const offsetIn = me('#fileWindowOffsetInput', containerEl);
                const sizeIn = me('#fileWindowSizeInput', containerEl);
                if (offsetIn) offsetIn.value = String(freshDefaults.fileStartOffset);
                if (sizeIn) sizeIn.value = String(freshDefaults.fileWindowSize);
                if (elements.fileInput) elements.fileInput.value = '';

                uiLock.refresh(standaloneContext, elements);
                ctrl.updateAllCanvases(standaloneContext, size, elements);
                triggerSimulationReset();
            });
        }

        window.openCustomWaveEditor = (targetNameKey = null) => {
            const editorModal = containerEl.first || containerEl;
            editorModal.classList.remove('hidden');

            if (targetNameKey && globalCustomWavetables && globalCustomWavetables[targetNameKey]) {
                const record = globalCustomWavetables[targetNameKey];
                if (elements.nameInput) elements.nameInput.value = targetNameKey;

                standaloneContext.importMode = record.importMode || (record['editor-state'] ? 'spline' : 'file');

                if (standaloneContext.importMode === 'spline' && record['editor-state']) {
                    const edState = record['editor-state'];
                    standaloneContext.splineTension = edState.splineTension;
                    standaloneContext.useSplineSmoothing = edState.useSplineSmoothing;
                    standaloneContext.lockEndsTogether = edState.lockEndsTogether;
                    standaloneContext.splineNodes = edState.splineNodes || [];
                } else if (standaloneContext.importMode === 'file') {
                    standaloneContext.rawFileBuffer = new Float32Array(record.values);
                    standaloneContext.fileStartOffset = 0;
                    standaloneContext.fileWindowSize = record.values.length;
                    
                    const offsetIn = me('#fileWindowOffsetInput', containerEl);
                    const sizeIn = me('#fileWindowSizeInput', containerEl);
                    if (offsetIn) offsetIn.value = "0";
                    if (sizeIn) sizeIn.value = String(record.values.length);
                }
                
                if (record.values) {
                    standaloneContext.customWaveTable = new Float32Array(record.values);
                }
            } else {
                if (elements.nameInput) elements.nameInput.value = "Custom Wavetable";
                const fresh = window.ComponentModule_CustomWaveDefaultState();
                Object.assign(standaloneContext, fresh);
            }

            if (standaloneContext.customWaveTable && elements.sizeSlider) {
                const currentLen = standaloneContext.customWaveTable.length;
                const sizeIdx = sizes.indexOf(currentLen);
                if (sizeIdx !== -1) {
                    elements.sizeSlider.value = sizeIdx;
                }
                if (elements.sizeLabel) {
                    elements.sizeLabel.textContent = String(currentLen);
                }
            }

            if (elements.tensionSlider) {
                elements.tensionSlider.value = standaloneContext.splineTension * 100;
                if (elements.tensionLabel) {
                    elements.tensionLabel.textContent = standaloneContext.splineTension === 0 ? "Smooth" : (standaloneContext.splineTension === 1 ? "Linear" : Math.round(standaloneContext.splineTension * 100) + "%");
                }
            }

            if (elements.smoothToggle && elements.smoothToggleVisual) {
                elements.smoothToggle.checked = standaloneContext.useSplineSmoothing;
                const smoothStr = String(standaloneContext.useSplineSmoothing);
                elements.smoothToggleVisual.setAttribute('data-active', smoothStr);
                if (elements.smoothToggleVisual.firstElementChild) {
                    elements.smoothToggleVisual.firstElementChild.setAttribute('data-active', smoothStr);
                }
            }

            if (elements.endsToggle && elements.endsToggleVisual) {
                elements.endsToggle.checked = standaloneContext.lockEndsTogether;
                const endsStr = String(standaloneContext.lockEndsTogether);
                elements.endsToggleVisual.setAttribute('data-active', endsStr);
                if (elements.endsToggleVisual.firstElementChild) {
                    elements.endsToggleVisual.firstElementChild.setAttribute('data-active', endsStr);
                }
            }

            uiLock.refresh(standaloneContext, elements);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
        };

        me('#clearWaveBtn', containerEl).on('click', () => {
            standaloneContext.importMode = 'spline';
            standaloneContext.rawFileBuffer = null;
            standaloneContext.splineNodes = [{
                id: crypto.randomUUID(),
                x: 0.0,
                y: 0,
                isFixed: true
            },
            {
                id: crypto.randomUUID(),
                x: 1.0,
                y: 0,
                isFixed: true
            }
            ];
            if (elements.fileInput) elements.fileInput.value = '';
            uiLock.refresh(standaloneContext, elements);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        me('#normalizeWaveBtn', containerEl).on('click', () => {
            ctrl.normalizeWave(standaloneContext);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        me('#fullStretchBtn', containerEl).on('click', () => {
            ctrl.stretchMinMax(standaloneContext);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        me('#snapEdgesBtn', containerEl).on('click', () => {
            if (standaloneContext.importMode === 'file') return;
            ctrl.snapEdgesToZero(standaloneContext);
            if (standaloneContext.lockEndsTogether) {
                standaloneContext.splineNodes[standaloneContext.splineNodes.length - 1].y = standaloneContext.splineNodes[0].y;
            }
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        me('#exportWavetableBtn', containerEl).on('click', () => {
            fileLoader.exportWavetable(standaloneContext, containerEl);
        });

        const offsetIn = me('#fileWindowOffsetInput', containerEl);
        const sizeIn = me('#fileWindowSizeInput', containerEl);

        const validateAndRunWindowUpdate = () => {
            if (standaloneContext.importMode !== 'file') return;

            let targetOffset = parseInt(offsetIn.value);
            if (isNaN(targetOffset) || targetOffset < 0) targetOffset = 0;

            let targetSize = parseInt(sizeIn.value);
            if (isNaN(targetSize) || targetSize < 1) targetSize = 256;

            if (standaloneContext.rawFileBuffer) {
                const maxLen = standaloneContext.rawFileBuffer.length;
                if (targetOffset >= maxLen) {
                    targetOffset = Math.max(0, maxLen - 1);
                }
            }

            standaloneContext.fileStartOffset = targetOffset;
            standaloneContext.fileWindowSize = targetSize;

            offsetIn.value = targetOffset;
            sizeIn.value = targetSize;

            ctrl.resizeWaveTable(standaloneContext, targetSize);
            if (elements.sizeLabel) elements.sizeLabel.textContent = String(targetSize);

            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        };

        if (offsetIn && sizeIn) {
            any([offsetIn, sizeIn]).on('input', validateAndRunWindowUpdate);
            any([offsetIn, sizeIn]).on('blur', validateAndRunWindowUpdate);

            any([offsetIn, sizeIn]).on('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                }
            });
            me('#fileOffsetUpBtn', containerEl).on('click', e => {
                e.preventDefault();
                offsetIn.value = String((parseInt(offsetIn.value) || 0) + 1);
                validateAndRunWindowUpdate();
            });
            me('#fileOffsetDownBtn', containerEl).on('click', e => {
                e.preventDefault();
                offsetIn.value = String(Math.max(0, (parseInt(offsetIn.value) || 0) - 1));
                validateAndRunWindowUpdate();
            });
            me('#fileSizeUpBtn', containerEl).on('click', e => {
                e.preventDefault();
                sizeIn.value = String((parseInt(sizeIn.value) || 1) + 1);
                validateAndRunWindowUpdate();
            });
            me('#fileSizeDownBtn', containerEl).on('click', e => {
                e.preventDefault();
                sizeIn.value = String(Math.max(1, (parseInt(sizeIn.value) || 1) - 1));
                validateAndRunWindowUpdate();
            });
        }
        setTimeout(() => {
            uiLock.refresh(standaloneContext, elements);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
        }, 50);
    }
};