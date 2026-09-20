window.ComponentModule_CustomWaveInteractions = {
    bind(containerEl, appStateInstance, size) {
        const ctrl = window.ComponentModule_CustomWaveController;

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
        };

        const sizes = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
        appStateInstance.activeDragNode = null;

        const triggerSimulationReset = () => {
            if (window.audio && typeof window.audio.restartSimulation === 'function') {
                window.audio.restartSimulation();
            }
        };

        if (appStateInstance.customWaveTable && elements.sizeSlider) {
            const currentLen = appStateInstance.customWaveTable.length;
            const sizeIdx = sizes.indexOf(currentLen);
            if (sizeIdx !== -1) {
                elements.sizeSlider.value = sizeIdx;
                if (elements.sizeLabel)
                    elements.sizeLabel.textContent = String(currentLen);
            }
        }

        if (appStateInstance.splineTension === undefined) {
            appStateInstance.splineTension = 0.0;
        } else if (elements.tensionSlider) {
            elements.tensionSlider.value = Math.round(appStateInstance.splineTension * 100);
            if (elements.tensionLabel) {
                elements.tensionLabel.textContent = appStateInstance.splineTension === 0 ? "Smooth" : (appStateInstance.splineTension === 1 ? "Linear" : Math.round(appStateInstance.splineTension * 100) + "%");
            }
        }

        if (elements.tensionSlider) {
            elements.tensionSlider.addEventListener('input', e => {
                const val = parseFloat(e.target.value) / 100;
                appStateInstance.splineTension = val;

                if (elements.tensionLabel) {
                    elements.tensionLabel.textContent = val === 0 ? "Smooth" : (val === 1 ? "Linear" : Math.round(val * 100) + "%");
                }

                ctrl.updateAllCanvases(appStateInstance, size, elements);
                triggerSimulationReset();
            });
        }

        const smoothBall = elements.smoothToggleVisual ? elements.smoothToggleVisual.firstElementChild : null;

        if (appStateInstance.useSplineSmoothing === undefined)
            appStateInstance.useSplineSmoothing = true;

        if (elements.smoothToggle) {
            elements.smoothToggle.addEventListener('change', e => {
                let isActive = !appStateInstance.useSplineSmoothing;
                e.target.checked = isActive;
                appStateInstance.useSplineSmoothing = isActive;

                const activeStr = isActive ? 'true' : 'false';
                if (elements.smoothToggleVisual) elements.smoothToggleVisual.setAttribute('data-active', activeStr);
                if (smoothBall) smoothBall.setAttribute('data-active', activeStr);

                ctrl.updateAllCanvases(appStateInstance, size, elements);
                triggerSimulationReset();
            });
        }

        const nativeCenter = elements.centerCanvas;
        if (!nativeCenter) return;

        nativeCenter.addEventListener('mousedown', e => {
            if (e.button === 2) return;
            const targetNode = ctrl.findClosestNode(e.clientX, e.clientY, appStateInstance, size, nativeCenter);
            if (targetNode) {
                appStateInstance.activeDragNode = targetNode;
                ctrl.updateAllCanvases(appStateInstance, size, elements);
            }
        });

        window.addEventListener('mousemove', e => {
            const dragNode = appStateInstance.activeDragNode;
            if (!dragNode) return;

            const rect = nativeCenter.getBoundingClientRect();

            if (!dragNode.isFixed) {
                dragNode.x = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / size));
            }
            dragNode.y = Math.max(-1.0, Math.min(1.0, ((size / 2) - (e.clientY - rect.top)) / (size / 2 - 2)));

            ctrl.updateAllCanvases(appStateInstance, size, elements);
        });

        window.addEventListener('mouseup', () => {
            if (!appStateInstance.activeDragNode) return;
            appStateInstance.activeDragNode = null;
            ctrl.updateAllCanvases(appStateInstance, size, elements);
            triggerSimulationReset();
        });

        nativeCenter.addEventListener('contextmenu', e => {
            e.preventDefault();
            const hitNode = ctrl.findClosestNode(e.clientX, e.clientY, appStateInstance, size, nativeCenter);
            if (hitNode) {
                ctrl.removeNode(hitNode, appStateInstance);
            } else {
                ctrl.addNode(e.clientX, e.clientY, appStateInstance, size, nativeCenter);
            }
            ctrl.updateAllCanvases(appStateInstance, size, elements);
            triggerSimulationReset();
        });

        if (elements.sizeSlider) {
            elements.sizeSlider.addEventListener('input', e => {
                const nextSize = sizes[parseInt(e.target.value) || 0];
                if (elements.sizeLabel) elements.sizeLabel.textContent = String(nextSize);

                ctrl.resizeWaveTable(appStateInstance, nextSize);
                ctrl.updateAllCanvases(appStateInstance, size, elements);
                triggerSimulationReset();
            });
        }

        any('#clearWaveBtn', containerEl).on('click', () => {
            appStateInstance.splineNodes = [
                { id: crypto.randomUUID(), x: 0.0, y: 0.0, isFixed: true },
                { id: crypto.randomUUID(), x: 1.0, y: 0.0, isFixed: true }
            ];
            ctrl.updateAllCanvases(appStateInstance, size, elements);
            triggerSimulationReset();
        });

        any('#normalizeWaveBtn', containerEl).on('click', () => {
            ctrl.normalizeWave(appStateInstance);
            ctrl.updateAllCanvases(appStateInstance, size, elements);
            triggerSimulationReset();
        });

        setTimeout(() => ctrl.updateAllCanvases(appStateInstance, size, elements), 50);
    }
};
