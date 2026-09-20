window.ComponentModule_CustomWaveController = {
    updateAllCanvases(state, size, elements) {
        if (!state.splineNodes) {
            state.splineNodes = [
                { id: crypto.randomUUID(), x: 0.0, y: 0.01, isFixed: true },
                { id: crypto.randomUUID(), x: 1.0, y: -0.01, isFixed: true }
            ];
        }

        this.generateTableFromSplines(state);

        const view = window.ComponentModule_CustomWaveCanvasRenderer;
        view.renderCanvasFrame(elements.centerCanvas, state.customWaveTable, state.splineNodes, state.activeDragNode, size, true);
        view.renderCanvasFrame(elements.leftCanvas, state.customWaveTable, null, null, size, false);
        view.renderCanvasFrame(elements.rightCanvas, state.customWaveTable, null, null, size, false);
    },

    generateTableFromSplines(state) {
        const math = window.ComponentModule_CustomWaveMath;
        const len = state.customWaveTable.length;
        const nodes = [...state.splineNodes].sort((a, b) => a.x - b.x);
        const tension = state.splineTension ?? 0.0;

        const tangents = math.calculateTangents(nodes, tension, state);

        for (let i = 0; i < len; i++) {
            const targetX = i / (len - 1);
            state.customWaveTable[i] = math.sampleSpline(targetX, nodes, tangents, tension);
        }
    },

    findClosestNode(clientX, clientY, state, size, canvasEl) {
        const nativeCanvas = canvasEl.getBoundingClientRect ? canvasEl : (canvasEl.first || canvasEl);
        if (!nativeCanvas || typeof nativeCanvas.getBoundingClientRect !== 'function') return null;

        const rect = nativeCanvas.getBoundingClientRect();
        const mouseX = (clientX - rect.left) / size;
        const mouseY = ((size / 2) - (clientY - rect.top)) / (size / 2 - 2);

        let closest = null;
        let minDistance = 0.08; 

        state.splineNodes.forEach(node => {
            const dx = node.x - mouseX;
            const dy = node.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) {
                minDistance = dist;
                closest = node;
            }
        });
        return closest;
    },

    addNode(clientX, clientY, state, size, canvasEl) {
        const nativeCanvas = canvasEl.getBoundingClientRect ? canvasEl : (canvasEl.first || canvasEl);
        if (!nativeCanvas || typeof nativeCanvas.getBoundingClientRect !== 'function') return;

        const rect = nativeCanvas.getBoundingClientRect();
        const posX = Math.max(0.01, Math.min(0.99, (clientX - rect.left) / size));
        const posY = Math.max(-1.0, Math.min(1.0, ((size / 2) - (clientY - rect.top)) / (size / 2 - 2)));

        state.splineNodes.push({ id: crypto.randomUUID(), x: posX, y: posY });
    },

    removeNode(node, state) {
        if (node.isFixed) return;
        state.splineNodes = state.splineNodes.filter(n => n.id !== node.id);
    },

    resizeWaveTable(state, newSize) {
        state.customWaveTable = new Float32Array(newSize);
        this.generateTableFromSplines(state);
    },

    normalizeWave(state) {
        if (!state.splineNodes || state.splineNodes.length < 2) return;
        
        const math = window.ComponentModule_CustomWaveMath;
        const nodes = [...state.splineNodes].sort((a, b) => a.x - b.x);
        const tension = state.splineTension ?? 0.0;

        const tangents = math.calculateTangents(nodes, tension, state);
        const peak = math.findTruePeak(nodes, tangents, tension);

        const scaleFactor = 1.0 / peak;
        state.splineNodes.forEach(node => {
            if (!node.isFixed || node.y !== 0) {
                node.y = Math.max(-1.0, Math.min(1.0, node.y * scaleFactor));
            }
        });
    }
};
