window.ComponentModule_CustomWaveCanvasRenderer = {
    renderCanvasFrame(canvasEl, table, nodes, activeDragNode, size, isMain, isLeftContext) {
        if (!canvasEl) return;
        const nativeCanvas = canvasEl.getContext ? canvasEl : (canvasEl.first || canvasEl);
        if (!nativeCanvas || !nativeCanvas.getContext) return;

        if (nativeCanvas.width !== nativeCanvas.clientWidth || nativeCanvas.height !== nativeCanvas.clientHeight) {
            nativeCanvas.width = nativeCanvas.clientWidth;
            nativeCanvas.height = nativeCanvas.clientHeight;
        }

        const w = nativeCanvas.width;
        const h = nativeCanvas.height;

        const ctx = nativeCanvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = isMain ? '#27272a' : '#18181b';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

        ctx.strokeStyle = isMain ? '#22d3ee' : '#71717a';
        ctx.lineWidth = isMain ? 2.5 : 1.5;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();

        const len = table.length;

        if (isMain) {
            for (let i = 0; i < len; i++) {
                const pctX = i / (len - 1);
                const drawX = pctX * w;
                const drawY = (h / 2) - (table[i] * (h / 2 - 4));

                if (i === 0) ctx.moveTo(drawX, drawY);
                else ctx.lineTo(drawX, drawY);
            }
        } else {
            const centerCanvasNode = document.getElementById('waveCanvasCenter');
            const targetStretchWidth = centerCanvasNode ? centerCanvasNode.clientWidth : w * 3;

            for (let i = 0; i < len; i++) {
                const pctX = i / (len - 1);
                
                let drawX;
                if (isLeftContext) {
                    drawX = (pctX * targetStretchWidth) - (targetStretchWidth - w);
                } else {
                    drawX = pctX * targetStretchWidth;
                }

                if (drawX >= -5 && drawX <= w + 5) {
                    const drawY = (h / 2) - (table[i] * (h / 2 - 4));
                    if (i === 0 || ctx.relativeStart === undefined) {
                        ctx.moveTo(drawX, drawY);
                        ctx.relativeStart = true;
                    } else {
                        ctx.lineTo(drawX, drawY);
                    }
                }
            }
            delete ctx.relativeStart;
        }
        ctx.stroke();

        if (isMain && nodes) {
            nodes.forEach(node => {
                const nx = node.x * w;
                const ny = (h / 2) - (node.y * (h / 2 - 4));

                ctx.fillStyle = node === activeDragNode ? '#fbbf24' : '#22d3ee';
                ctx.strokeStyle = '#09090b';
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(nx, ny, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            });
        }
    }
};
