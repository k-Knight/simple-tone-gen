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

        const getEventCoordinates = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
            }
            return { clientX: e.clientX, clientY: e.clientY };
        };

        const handleStartGesture = (e) => {
            if (standaloneContext.importMode === 'file' || e.button === 2) return;
            
            const coords = getEventCoordinates(e);
            const targetNode = ctrl.findClosestNode(coords.clientX, coords.clientY, standaloneContext, size, nativeCenter);
            
            if (targetNode) {
                standaloneContext.activeDragNode = targetNode;
                ctrl.updateAllCanvases(standaloneContext, size, elements);
                
                if (e.cancelable) e.preventDefault();
            }
        };

        nativeCenter.addEventListener('mousedown', handleStartGesture);
        nativeCenter.addEventListener('touchstart', handleStartGesture, { passive: false });

        const handleMoveGesture = (e) => {
            if (standaloneContext.importMode === 'file') return;
            const dragNode = standaloneContext.activeDragNode;
            if (!dragNode) return;

            if (e.cancelable) e.preventDefault();

            const coords = getEventCoordinates(e);
            const rect = nativeCenter.getBoundingClientRect();
            
            if (!dragNode.isFixed) {
                dragNode.x = Math.max(0.01, Math.min(0.99, (coords.clientX - rect.left) / rect.width));
            }

            const pctY = (coords.clientY - rect.top) / rect.height;
            const new_y = Math.max(-1.0, Math.min(1.0, (0.5 - pctY) * (rect.height / (rect.height / 2 - 4))));

            if (dragNode.isFixed && standaloneContext.lockEndsTogether) {
                standaloneContext.splineNodes[0].y = new_y;
                standaloneContext.splineNodes[standaloneContext.splineNodes.length - 1].y = new_y;
            } else {
                dragNode.y = new_y;
            }

            ctrl.updateAllCanvases(standaloneContext, size, elements);
        };

        window.addEventListener('mousemove', handleMoveGesture);
        window.addEventListener('touchmove', handleMoveGesture, { passive: false });

        const handleEndGesture = () => {
            if (standaloneContext.importMode === 'file' || !standaloneContext.activeDragNode) return;
            standaloneContext.activeDragNode = null;
            ctrl.updateAllCanvases(standaloneContext, size, elements);
            triggerReset();
        };

        window.addEventListener('mouseup', handleEndGesture);
        window.addEventListener('touchend', handleEndGesture);

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
