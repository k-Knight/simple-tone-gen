window.ComponentModule_CustomWaveInteractionsEvents = {
    bindSliders(standaloneContext, elements, ctrl, size) {
        if (elements.tensionSlider) {
            elements.tensionSlider.addEventListener('input', e => {
                if (standaloneContext.importMode === 'file') return;
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
                if (standaloneContext.importMode === 'file') return;

                let isActive = !standaloneContext.useSplineSmoothing;
                standaloneContext.useSplineSmoothing = isActive;
                e.target.checked = isActive;

                const activeStr = isActive ? 'true' : 'false';
                if (elements.smoothToggleVisual) {
                    elements.smoothToggleVisual.setAttribute('data-active', activeStr);

                    if (elements.smoothToggleVisual.firstElementChild) {
                        elements.smoothToggleVisual.firstElementChild.setAttribute('data-active', activeStr);
                    }
                }

                ctrl.updateAllCanvases(standaloneContext, size, elements);
            });
        }

        if (elements.endsToggle) {
            elements.endsToggle.addEventListener('change', e => {
                if (standaloneContext.importMode === 'file') return;

                let isActive = !standaloneContext.lockEndsTogether;
                standaloneContext.lockEndsTogether = isActive;
                e.target.checked = isActive;

                const activeStr = isActive ? 'true' : 'false';
                if (elements.endsToggleVisual) {
                    elements.endsToggleVisual.setAttribute('data-active', activeStr);

                    if (elements.endsToggleVisual.firstElementChild) {
                        elements.endsToggleVisual.firstElementChild.setAttribute('data-active', activeStr);
                    }
                }

                if (isActive && standaloneContext.splineNodes.length >= 2) {
                    standaloneContext.splineNodes[standaloneContext.splineNodes.length - 1].y = standaloneContext.splineNodes[0].y;
                }
                ctrl.updateAllCanvases(standaloneContext, size, elements);
            });
        }
    },

    bindCanvasMouse(standaloneContext, elements, ctrl, size, triggerReset) {
        const nativeCenter = elements.centerCanvas;
        if (!nativeCenter) return;

        nativeCenter.addEventListener('mousedown', e => {
            if (standaloneContext.importMode === 'file' || e.button === 2) return;
            const targetNode = ctrl.findClosestNode(e.clientX, e.clientY, standaloneContext, size, nativeCenter);
            if (targetNode) {
                standaloneContext.activeDragNode = targetNode;
                ctrl.updateAllCanvases(standaloneContext, size, elements);
            }
        });

        window.addEventListener('mousemove', e => {
            if (standaloneContext.importMode === 'file') return;
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
            } else {
                dragNode.y = new_y;
            }

            ctrl.updateAllCanvases(standaloneContext, size, elements);
        });

        window.addEventListener('mouseup', () => {
            if (standaloneContext.importMode === 'file' || !standaloneContext.activeDragNode) return;
            standaloneContext.activeDragNode = null;
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerReset();
        });

        nativeCenter.addEventListener('contextmenu', e => {
            e.preventDefault();
            if (standaloneContext.importMode === 'file') return;
            const hitNode = ctrl.findClosestNode(e.clientX, e.clientY, standaloneContext, size, nativeCenter);
            if (hitNode) {
                ctrl.removeNode(hitNode, standaloneContext);
            } else {
                ctrl.addNode(e.clientX, e.clientY, standaloneContext, size, nativeCenter);
            }
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerReset();
        });
    }
};
