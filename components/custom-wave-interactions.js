window.ComponentModule_CustomWaveInteractions = {
    bind(containerEl, appStateInstance, size) {
        const ctrl = window.ComponentModule_CustomWaveController;

        // Extract the native canvas elements out of the Surreal collections
        const elements = {
            centerCanvas: any('#waveCanvasCenter', containerEl)[0] || any('#waveCanvasCenter', containerEl).first,
            leftCanvas: any('#waveCanvasLeft', containerEl)[0] || any('#waveCanvasLeft', containerEl).first,
            rightCanvas: any('#waveCanvasRight', containerEl)[0] || any('#waveCanvasRight', containerEl).first,
            previewGrid: any('#tableDataPreview', containerEl)[0] || any('#tableDataPreview', containerEl).first,
            statusLabel: any('#drawStatusLabel', containerEl)
        };

        let isDrawing = false;
        let lastX = null;

        const triggerSimulationReset = () => {
            if (window.audio && typeof window.audio.restartSimulation === 'function') {
                window.audio.restartSimulation();
            }
        };

        any(elements.centerCanvas).on('mousedown', e => {
            isDrawing = true;
            lastX = null;
            if (elements.statusLabel) (elements.statusLabel[0] || elements.statusLabel).textContent = 'Drawing';
            lastX = ctrl.handleDrawPosition(e.clientX, e.clientY, appStateInstance, size, lastX, elements);
        });

        window.addEventListener('mousemove', e => {
            if (!isDrawing) return;
            lastX = ctrl.handleDrawPosition(e.clientX, e.clientY, appStateInstance, size, lastX, elements);
        });

        window.addEventListener('mouseup', () => {
            if (!isDrawing) return;
            isDrawing = false;
            lastX = null;
            if (elements.statusLabel) (elements.statusLabel[0] || elements.statusLabel).textContent = 'Idle';
            triggerSimulationReset();
        });

        any(elements.centerCanvas).on('touchstart', e => {
            isDrawing = true;
            lastX = null;
            if (e.touches && e.touches.length > 0) {
                lastX = ctrl.handleDrawPosition(e.touches[0].clientX, e.touches[0].clientY, appStateInstance, size, lastX, elements);
            }
        });

        any(elements.centerCanvas).on('touchmove', e => {
            if (!isDrawing) return;
            if (e.cancelable) e.preventDefault();
            if (e.touches && e.touches.length > 0) {
                lastX = ctrl.handleDrawPosition(e.touches[0].clientX, e.touches[0].clientY, appStateInstance, size, lastX, elements);
            }
        });

        any('#clearWaveBtn', containerEl).on('click', () => {
            appStateInstance.customWaveTable.fill(0);
            ctrl.updateAllCanvases(appStateInstance, size, elements);
            triggerSimulationReset();
        });

        any('#normalizeWaveBtn', containerEl).on('click', () => {
            ctrl.normalizeWave(appStateInstance);
            ctrl.updateAllCanvases(appStateInstance, size, elements);
            triggerSimulationReset();
        });

        any('#smoothWaveBtn', containerEl).on('click', () => {
            ctrl.smoothWave(appStateInstance);
            ctrl.updateAllCanvases(appStateInstance, size, elements);
            triggerSimulationReset();
        });

        setTimeout(() => ctrl.updateAllCanvases(appStateInstance, size, elements), 50);
    }
};
