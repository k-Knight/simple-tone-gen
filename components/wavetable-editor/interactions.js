window.ComponentModule_CustomWaveInteractions = {
    bind(containerEl, standaloneContext, size) {
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
            endsToggle: containerEl.querySelector('#lockEndsTogetherToggle'),
            endsToggleVisual: containerEl.querySelector('#lockEndsTogetherToggleVisual'),
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

        if (elements.tensionSlider) {
            elements.tensionSlider.addEventListener('input', e => {
                const val = parseFloat(e.target.value) / 100;
                standaloneContext.splineTension = val;
                if (elements.tensionLabel) {
                    elements.tensionLabel.textContent = val === 0 ? "Smooth" : (val === 1 ? "Linear" : Math.round(val * 100) + "%");
                }
                ctrl.updateAllCanvases(standaloneContext, size, elements);
            });
        }

        if (elements.smoothToggle) {
            elements.smoothToggle.addEventListener('change', e => {
                let isActive = !standaloneContext.useSplineSmoothing;
                e.target.checked = isActive;
                standaloneContext.useSplineSmoothing = isActive;

                const activeStr = isActive ? 'true' : 'false';
                if (elements.smoothToggleVisual) elements.smoothToggleVisual.setAttribute('data-active', activeStr);
                if (elements.smoothToggleVisual && elements.smoothToggleVisual.firstElementChild) {
                    elements.smoothToggleVisual.firstElementChild.setAttribute('data-active', activeStr);
                }

                ctrl.updateAllCanvases(standaloneContext, size, elements);
            });
        }

        if (elements.endsToggle) {
            elements.endsToggle.addEventListener('change', e => {
                let isActive = !standaloneContext.lockEndsTogether;
                e.target.checked = isActive;
                standaloneContext.lockEndsTogether = isActive;

                const activeStr = isActive ? 'true' : 'false';
                if (elements.endsToggleVisual) elements.endsToggleVisual.setAttribute('data-active', activeStr);
                if (elements.endsToggleVisual && elements.endsToggleVisual.firstElementChild) {
                    elements.endsToggleVisual.firstElementChild.setAttribute('data-active', activeStr);
                }

                if (isActive) {
                    const numNodes = standaloneContext.splineNodes.length;
                    standaloneContext.splineNodes[numNodes - 1].y = standaloneContext.splineNodes[0].y
                }

                ctrl.updateAllCanvases(standaloneContext, size, elements);
            });
        }

        const nativeCenter = elements.centerCanvas;
        if (!nativeCenter) return;

        nativeCenter.addEventListener('mousedown', e => {
            if (e.button === 2) return;
            const targetNode = ctrl.findClosestNode(e.clientX, e.clientY, standaloneContext, size, nativeCenter);
            if (targetNode) {
                standaloneContext.activeDragNode = targetNode;
                ctrl.updateAllCanvases(standaloneContext, size, elements);
            }
        });

        window.addEventListener('mousemove', e => {
            const dragNode = standaloneContext.activeDragNode;
            if (!dragNode) return;

            const rect = nativeCenter.getBoundingClientRect();

            if (!dragNode.isFixed) {
                dragNode.x = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
            }
            
            const pctY = (e.clientY - rect.top) / rect.height;
            const new_y = Math.max(-1.0, Math.min(1.0, (0.5 - pctY) * (rect.height / (rect.height / 2 - 4))));

            if (dragNode.isFixed && standaloneContext.lockEndsTogether) {
                standaloneContext.splineNodes[0].y = new_y;
                standaloneContext.splineNodes[standaloneContext.splineNodes.length - 1].y = new_y;
            } else
                dragNode.y = new_y

            ctrl.updateAllCanvases(standaloneContext, size, elements);
        });

        window.addEventListener('mouseup', () => {
            if (!standaloneContext.activeDragNode) return;
            standaloneContext.activeDragNode = null;
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        nativeCenter.addEventListener('contextmenu', e => {
            e.preventDefault();
            const hitNode = ctrl.findClosestNode(e.clientX, e.clientY, standaloneContext, size, nativeCenter);
            if (hitNode) {
                ctrl.removeNode(hitNode, standaloneContext);
            } else {
                ctrl.addNode(e.clientX, e.clientY, standaloneContext, size, nativeCenter);
            }
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        if (elements.sizeSlider) {
            elements.sizeSlider.addEventListener('input', e => {
                const nextSize = sizes[parseInt(e.target.value) || 0];
                if (elements.sizeLabel) elements.sizeLabel.textContent = String(nextSize);

                ctrl.resizeWaveTable(standaloneContext, nextSize);
                ctrl.updateAllCanvases(standaloneContext, size, elements);
            });
        }

        const editorModal = containerEl.first || containerEl;
        const closeBtn = containerEl.querySelector('#closeWaveEditorBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                editorModal.classList.add('hidden');
            });
        }

        window.openCustomWaveEditor = () => {
            editorModal.classList.remove('hidden');
            ctrl.updateAllCanvases(standaloneContext, size, elements);
        };

        any('#clearWaveBtn', containerEl).on('click', () => {
            standaloneContext.splineNodes = [
                { id: crypto.randomUUID(), x: 0.0, y: 0, isFixed: true },
                { id: crypto.randomUUID(), x: 1.0, y: 0, isFixed: true }
            ];
            ctrl.updateAllCanvases(standaloneContext, size, elements);
        });

        any('#normalizeWaveBtn', containerEl).on('click', () => {
            ctrl.normalizeWave(standaloneContext);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
        });

        any('#fullStretchBtn', containerEl).on('click', () => {
            ctrl.stretchMinMax(standaloneContext);
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        any('#snapEdgesBtn', containerEl).on('click', () => {
            ctrl.snapEdgesToZero(standaloneContext);
            if (standaloneContext.lockEndsTogether) {
                const numNodes = standaloneContext.splineNodes.length;
                standaloneContext.splineNodes[numNodes - 1].y = standaloneContext.splineNodes[0].y;
            }
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerSimulationReset();
        });

        setTimeout(() => ctrl.updateAllCanvases(standaloneContext, size, elements), 50);
    }
};