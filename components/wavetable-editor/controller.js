window.ComponentModule_CustomWaveController = {
    updateAllCanvases(state, size, elements) {
        if (!state.splineNodes) {
            state.splineNodes = [
                { id: crypto.randomUUID(), x: 0.0, y: 0, isFixed: true },
                { id: crypto.randomUUID(), x: 1.0, y: 0, isFixed: true }
            ];
        }

        this.generateTableFromSplines(state);
        const nodes = [...state.splineNodes].sort((a, b) => a.x - b.x);
        state.splineNodes = nodes;

        const view = window.ComponentModule_CustomWaveCanvasRenderer;
        view.renderCanvasFrame(elements.centerCanvas, state.customWaveTable, state.splineNodes, state.activeDragNode, size, true, false);
        view.renderCanvasFrame(elements.leftCanvas, state.customWaveTable, null, null, size, false, true);
        view.renderCanvasFrame(elements.rightCanvas, state.customWaveTable, null, null, size, false, false);
    },

    generateTableFromSplines(state) {
        const math = window.ComponentModule_CustomWaveMath;
        const len = state.customWaveTable.length;
        const nodes = state.splineNodes;
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
        const w = nativeCanvas.width;
        const h = nativeCanvas.height;
        
        const mousePixelX = ((clientX - rect.left) / rect.width) * w;
        const mousePixelY = ((clientY - rect.top) / rect.height) * h;

        let closest = null;
        let minDistancePixels = 16.0;

        state.splineNodes.forEach(node => {
            const nodePixelX = node.x * w;
            const nodePixelY = (h / 2) - (node.y * (h / 2 - 4));

            const dx = nodePixelX - mousePixelX;
            const dy = nodePixelY - mousePixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDistancePixels) {
                minDistancePixels = dist;
                closest = node;
            }
        });
        return closest;
    },

    addNode(clientX, clientY, state, size, canvasEl) {
        const nativeCanvas = canvasEl.getBoundingClientRect ? canvasEl : (canvasEl.first || canvasEl);
        if (!nativeCanvas || typeof nativeCanvas.getBoundingClientRect !== 'function') return;

        const rect = nativeCanvas.getBoundingClientRect();
        
        const posX = Math.max(0.01, Math.min(0.99, (clientX - rect.left) / rect.width));
        const pctY = (clientY - rect.top) / rect.height;
        const posY = Math.max(-1.0, Math.min(1.0, (0.5 - pctY) * (rect.height / (rect.height / 2 - 4))));

        const newNode = { id: crypto.randomUUID(), x: posX, y: posY };

        let insertIdx = state.splineNodes.findIndex(node => node.x > posX);
        
        if (insertIdx === -1) {
            insertIdx = Math.max(0, state.splineNodes.length - 1);
        }

        state.splineNodes.splice(insertIdx, 0, newNode);
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
        const nodes = state.splineNodes;
        const tension = state.splineTension ?? 0.0;
        const tangents = math.calculateTangents(nodes, tension, state);
        
        const bounds = math.findTrueExtrema(nodes, tangents, tension);
        const peak = Math.max(Math.abs(bounds.min), Math.abs(bounds.max));

        if (peak < 0.0001) return;

        const scaleFactor = 1.0 / peak;
        state.splineNodes.forEach(node => {
            if (!node.isFixed || node.y !== 0) {
                node.y = Math.max(-1.0, Math.min(1.0, node.y * scaleFactor));
            }
        });
    },

    stretchMinMax(state) {
        if (!state.splineNodes || state.splineNodes.length < 2) return;

        const math = window.ComponentModule_CustomWaveMath;
        const nodes = state.splineNodes;
        const tension = state.splineTension ?? 0.0;
        const tangents = math.calculateTangents(nodes, tension, state);

        const bounds = math.findTrueExtrema(nodes, tangents, tension);
        const range = bounds.max - bounds.min;
        
        if (range < 0.0001) return;

        state.splineNodes.forEach(node => {
            const scaledY = -1.0 + 2.0 * ((node.y - bounds.min) / range);
            node.y = Math.max(-1.0, Math.min(1.0, scaledY));
        });
    },

    snapEdgesToZero(state) {
        if (!state.splineNodes || state.splineNodes.length < 2) return;

        const firstNode = state.splineNodes[0];
        const lastNode = state.splineNodes[state.splineNodes.length - 1];

        if (firstNode) firstNode.y = 0.0;
        if (lastNode) lastNode.y = 0.0;
    }
};
