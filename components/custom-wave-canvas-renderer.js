window.ComponentModule_CustomWaveCanvasRenderer = {
    renderCanvasFrame(canvasEl, table, nodes, activeDragNode, size, isMain) {
        if (!canvasEl) return;
        const nativeCanvas = canvasEl.getContext ? canvasEl : (canvasEl.first || canvasEl);
        if (!nativeCanvas || !nativeCanvas.getContext) return;

        const ctx = nativeCanvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);

        ctx.strokeStyle = isMain ? '#27272a' : '#55555b';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2); ctx.stroke();

        ctx.strokeStyle = isMain ? '#22d3ee' : '#27e2ff';
        ctx.lineWidth = isMain ? 2.5 : 1.5;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();

        const len = table.length;
        for (let i = 0; i < len; i++) {
            const pctX = i / (len - 1);
            const drawX = pctX * size;
            const drawY = (size / 2) - (table[i] * (size / 2 - 2));

            if (i === 0) ctx.moveTo(drawX, drawY);
            else ctx.lineTo(drawX, drawY);
        }
        ctx.stroke();

        if (isMain && nodes) {
            nodes.forEach(node => {
                const nx = node.x * size;
                const ny = (size / 2) - (node.y * (size / 2 - 2));

                ctx.fillStyle = node === activeDragNode ? '#fbbf24' : '#22d3ee';
                ctx.strokeStyle = '#09090b';
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(nx, ny, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            });
        }
    }
};
