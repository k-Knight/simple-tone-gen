window.ComponentModule_CustomWaveInteractions = {
    bind(containerEl, standaloneContext, size) {
        const ctrl = window.ComponentModule_CustomWaveController;
        const uiLock = window.ComponentModule_CustomWaveInteractionsUILock;
        const fileLoader = window.ComponentModule_CustomWaveInteractionsFileLoader;
        const ev = window.ComponentModule_CustomWaveInteractionsEvents;

        const elements = {
            centerCanvas: containerEl.querySelector('#waveCanvasCenter'),
            leftCanvas: containerEl.querySelector('#waveCanvasLeft'),
            rightCanvas: containerEl.querySelector('#waveCanvasRight'),
            sizeSlider: containerEl.querySelector('#waveSizeSlider'),
            sizeLabel: containerEl.querySelector('#waveSizeLabel'),
            tensionSlider: containerEl.querySelector('#splineTensionSlider'),
            tensionLabel: containerEl.querySelector('#splineTensionLabel'),
            smoothToggle: containerEl.querySelector('#splineSmoothToggle'),
            smoothToggleVisual: containerEl.querySelector('#splineSmoothToggleVisual'),
            endsToggle: containerEl.querySelector('#lockEndsTogetherToggle'),
            endsToggleVisual: containerEl.querySelector('#lockEndsTogetherToggleVisual'),
            fileInput: containerEl.querySelector('#wavFileInputTarget'),
            fileBtn: containerEl.querySelector('#loadWavFileButton'),
            snapEdgesBtn: containerEl.querySelector('#snapEdgesBtn')
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

        ev.bindSliders(standaloneContext, elements, ctrl, size);
        ev.bindCanvasMouse(standaloneContext, elements, ctrl, size, triggerSimulationReset);
        fileLoader.bind(standaloneContext, elements, size, ctrl, triggerSimulationReset, uiLock.refresh);

        if (elements.sizeSlider) {
            elements.sizeSlider.addEventListener('input', e => {
                const nextSize = sizes[parseInt(e.target.value) || 0];
                if (elements.sizeLabel) elements.sizeLabel.textContent = String(nextSize);
                ctrl.resizeWaveTable(standaloneContext, nextSize);
                ctrl.updateAllCanvases(standaloneContext, size, elements);
                triggerSimulationReset();
            });
        }

        const editorModal = containerEl.first || containerEl;
        const closeBtn = containerEl.querySelector('#closeWaveEditorBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                editorModal.classList.add('hidden');
                const freshDefaults = window.ComponentModule_CustomWaveDefaultState();

                Object.assign(standaloneContext, freshDefaults);
                standaloneContext.customWaveTable = freshDefaults.customWaveTable;
                standaloneContext.splineNodes = freshDefaults.splineNodes;

                if (elements.sizeSlider && standaloneContext.customWaveTable) {
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

                const offsetIn = containerEl.querySelector('#fileWindowOffsetInput');
                const sizeIn = containerEl.querySelector('#fileWindowSizeInput');
                if (offsetIn) offsetIn.value = String(freshDefaults.fileStartOffset);
                if (sizeIn) sizeIn.value = String(freshDefaults.fileWindowSize);
                if (elements.fileInput) elements.fileInput.value = '';

                uiLock.refresh(standaloneContext, elements);
                ctrl.updateAllCanvases(standaloneContext, size, elements);
                triggerSimulationReset();
            });
        }

        window.openCustomWaveEditor = () => {
            editorModal.classList.remove('hidden');
            uiLock.refresh(standaloneContext, elements);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
        };

        any('#clearWaveBtn', containerEl).on('click', () => {
            standaloneContext.importMode = 'spline';
            standaloneContext.rawFileBuffer = null;
            standaloneContext.splineNodes = [
                { id: crypto.randomUUID(), x: 0.0, y: 0, isFixed: true },
                { id: crypto.randomUUID(), x: 1.0, y: 0, isFixed: true }
            ];
            if (elements.fileInput) elements.fileInput.value = '';
            uiLock.refresh(standaloneContext, elements);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        any('#normalizeWaveBtn', containerEl).on('click', () => {
            ctrl.normalizeWave(standaloneContext);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        any('#fullStretchBtn', containerEl).on('click', () => {
            ctrl.stretchMinMax(standaloneContext);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        any('#snapEdgesBtn', containerEl).on('click', () => {
            if (standaloneContext.importMode === 'file') return;
            ctrl.snapEdgesToZero(standaloneContext);
            if (standaloneContext.lockEndsTogether) {
                standaloneContext.splineNodes[standaloneContext.splineNodes.length - 1].y = standaloneContext.splineNodes[0].y;
            }
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        any('#exportWavetableBtn', containerEl).on('click', () => {
            fileLoader.exportWavetable(standaloneContext, containerEl);
        });

        const offsetIn = containerEl.querySelector('#fileWindowOffsetInput');
        const sizeIn = containerEl.querySelector('#fileWindowSizeInput');

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
            offsetIn.addEventListener('input', validateAndRunWindowUpdate);
            sizeIn.addEventListener('input', validateAndRunWindowUpdate);
            offsetIn.addEventListener('blur', validateAndRunWindowUpdate);
            sizeIn.addEventListener('blur', validateAndRunWindowUpdate);

            offsetIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); offsetIn.blur(); } });
            sizeIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sizeIn.blur(); } });

            containerEl.querySelector('#fileOffsetUpBtn').addEventListener('click', (e) => { 
                e.preventDefault();
                offsetIn.value = String((parseInt(offsetIn.value) || 0) + 1); 
                validateAndRunWindowUpdate(); 
            });
            containerEl.querySelector('#fileOffsetDownBtn').addEventListener('click', (e) => { 
                e.preventDefault();
                offsetIn.value = String(Math.max(0, (parseInt(offsetIn.value) || 0) - 1)); 
                validateAndRunWindowUpdate(); 
            });
            containerEl.querySelector('#fileSizeUpBtn').addEventListener('click', (e) => { 
                e.preventDefault();
                sizeIn.value = String((parseInt(sizeIn.value) || 1) + 1); 
                validateAndRunWindowUpdate(); 
            });
            containerEl.querySelector('#fileSizeDownBtn').addEventListener('click', (e) => { 
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
