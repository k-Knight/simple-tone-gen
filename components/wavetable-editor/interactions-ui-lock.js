window.ComponentModule_CustomWaveInteractionsUILock = {
    refresh(standaloneContext, elements) {
        const isFile = standaloneContext.importMode === 'file';
        
        if (elements.tensionSlider) elements.tensionSlider.disabled = isFile;
        if (elements.tensionLabel) elements.tensionLabel.disabled = isFile;
        if (elements.smoothToggle) elements.smoothToggle.disabled = isFile;
        if (elements.endsToggle) elements.endsToggle.disabled = isFile;
        if (elements.snapEdgesBtn) elements.snapEdgesBtn.disabled = isFile;
        if (elements.sizeSlider) elements.sizeSlider.disabled = isFile;
        if (elements.sizeLabel) elements.sizeLabel.disabled = isFile;

        const controls = [
            elements.tensionSlider,
            elements.tensionLabel,
            elements.smoothToggleVisual,
            elements.endsToggleVisual,
            elements.snapEdgesBtn,
            elements.sizeSlider,
            elements.sizeLabel
        ];

        controls.forEach(el => {
            if (!el) return;
            if (isFile) {
                el.classList.add('opacity-30', 'cursor-not-allowed');
            } else {
                el.classList.remove('opacity-30', 'cursor-not-allowed');
            }
        });

        const fileControlsWrap = document.getElementById('fileWindowControlsContainer');
        if (fileControlsWrap) {
            if (!isFile) fileControlsWrap.classList.add('opacity-40', 'pointer-events-none', 'cursor-not-allowed');
            else fileControlsWrap.classList.remove('opacity-40', 'pointer-events-none', 'cursor-not-allowed');
        }

        if (elements.centerCanvas) {
            const wrap = elements.centerCanvas.parentElement;
            if (isFile) {
                wrap.classList.remove('cursor-crosshair');
                wrap.classList.add('cursor-not-allowed', 'opacity-85');
            } else {
                wrap.classList.remove('cursor-not-allowed', 'opacity-85');
                wrap.classList.add('cursor-crosshair');
            }
        }
    }
};
