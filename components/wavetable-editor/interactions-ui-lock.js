window.ComponentModule_CustomWaveInteractionsUILock = {
    refresh(standaloneContext, elements) {
        const isFile = standaloneContext.importMode === 'file';
        
        any([
            elements.tensionSlider,
            elements.tensionLabel,
            elements.smoothToggle,
            elements.endsToggle,
            elements.snapEdgesBtn,
            elements.sizeSlider,
            elements.sizeLabel
        ]).run(el => { if (el) el.disabled = isFile; });

        const controls = any([
            elements.tensionSlider,
            elements.tensionLabel,
            elements.smoothToggleVisual,
            elements.endsToggleVisual,
            elements.snapEdgesBtn,
            elements.sizeSlider,
            elements.sizeLabel
        ]);

        if (isFile) {
            controls.classAdd('opacity-30', 'cursor-not-allowed').classRemove('opacity-100');
        } else {
            controls.classRemove('opacity-30', 'cursor-not-allowed');
        }

        const fileControlsWrap = me('#fileWindowControlsContainer');
        if (fileControlsWrap) {
            if (!isFile) {
                me(fileControlsWrap).classAdd('opacity-40', 'pointer-events-none', 'cursor-not-allowed');
            } else {
                me(fileControlsWrap).classRemove('opacity-40', 'pointer-events-none', 'cursor-not-allowed');
            }
        }

        if (elements.centerCanvas) {
            const wrap = me(elements.centerCanvas.parentElement);
            if (isFile) {
                wrap.classRemove('cursor-crosshair').classAdd('cursor-not-allowed', 'opacity-85');
            } else {
                wrap.classRemove('cursor-not-allowed', 'opacity-85').classAdd('cursor-crosshair');
            }
        }
    }
};
