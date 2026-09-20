window.ComponentModule_CustomWaveCanvasTable = {
    render(localContext, viewSize) {
        return html`
            <div class="border border-zinc-800 rounded-xl overflow-hidden text-xs font-mono">
                ${window.ComponentModule_CustomWaveCanvasTopGrid.render()}
                ${window.ComponentModule_CustomWaveCanvasWorkspace.render(localContext, viewSize)}
            </div>
        `;
    }
};
