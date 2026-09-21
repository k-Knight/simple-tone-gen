window.ComponentModule_CustomWaveDefaultState = () => ({
    customWaveTable: new Float32Array(256),
    splineTension: 0.0,
    useSplineSmoothing: true,
    lockEndsTogether: false,
    importMode: 'spline',
    rawFileBuffer: null,
    fileStartOffset: 0,
    fileWindowSize: 256,
    splineNodes: [
        { id: crypto.randomUUID(), x: 0.0, y: 0.01, isFixed: true },
        { id: crypto.randomUUID(), x: 1.0, y: -0.01, isFixed: true }
    ]
});

window.ComponentModule_CustomWaveCanvas = {
    render() {
        const localContext = window.ComponentModule_CustomWaveDefaultState();

        const viewSize = 300;
        const totalWidth = viewSize * 3;

        const containerEl = html`
            <div id="waveEditorPopup" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
                <section class="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl space-y-4 max-w-5xl w-full max-h-[95vh] overflow-y-auto relative">
                    ${window.ComponentModule_CustomWaveCanvasHeader.render()}
                    ${window.ComponentModule_CustomWaveCanvasTable.render(localContext, viewSize, totalWidth)}
                </section>
            </div>
        `;

        window.ComponentModule_CustomWaveInteractions.bind(containerEl, localContext, viewSize);
        return containerEl;
    }
};
