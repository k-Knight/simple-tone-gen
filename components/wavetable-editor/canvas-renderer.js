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

        if (isMain) {
            ctx.strokeStyle = '#3f3f46';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            
            ctx.beginPath();
            ctx.moveTo(0, 4); ctx.lineTo(w, 4);
            ctx.moveTo(0, h - 4); ctx.lineTo(w, h - 4);
            ctx.stroke();
            ctx.setLineDash([]); 
        }

        ctx.strokeStyle = isMain ? '#22d3ee' : '#71717a';
        ctx.lineWidth = isMain ? 2.5 : 1.5;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();

        const len = table.length;

        const getDrawCoords = (index, totalPoints) => {
            const pctX = index / (totalPoints - 1);
            let drawX;
            if (!isMain) {
                const centerCanvasNode = document.getElementById('waveCanvasCenter');
                const targetStretchWidth = centerCanvasNode ? centerCanvasNode.clientWidth : w * 3;
                drawX = isLeftContext ? (pctX * targetStretchWidth) - (targetStretchWidth - w) : pctX * targetStretchWidth;
            } else {
                drawX = pctX * w;
            }

            const rawValue = table[index];
            const drawY = (h / 2) - (rawValue * (h / 2 - 4));
            return { x: drawX, y: drawY, val: rawValue };
        };

        const minYLimit = 4;
        const maxYLimit = h - 4;

        let pathStarted = false;

        for (let i = 0; i < len - 1; i++) {
            const p1 = getDrawCoords(i, len);
            const p2 = getDrawCoords(i + 1, len);

            if (!isMain && (p1.x < -10 && p2.x < -10 || p1.x > w + 10 && p2.x > w + 10)) {
                continue;
            }

            const clampY = (y) => Math.max(minYLimit, Math.min(maxYLimit, y));

            if (!pathStarted) {
                ctx.moveTo(p1.x, clampY(p1.y));
                pathStarted = true;
            }

            const p1ClippedTop = p1.val > 1.0;
            const p1ClippedBot = p1.val < -1.0;
            const p2ClippedTop = p2.val > 1.0;
            const p2ClippedBot = p2.val < -1.0;

            if ((p1ClippedTop && p2ClippedTop) || (p1ClippedBot && p2ClippedBot)) {
                ctx.lineTo(p2.x, clampY(p2.y));
            } 
            else if (p1ClippedTop !== p2ClippedTop || p1ClippedBot !== p2ClippedBot) {
                let targetVal = 1.0;
                if (p1ClippedBot || p2ClippedBot) targetVal = -1.0;

                const t = (targetVal - p1.val) / (p2.val - p1.val);
                const intersectX = p1.x + t * (p2.x - p1.x);
                const intersectY = clampY((h / 2) - (targetVal * (h / 2 - 4)));

                if (p1ClippedTop || p1ClippedBot) {
                    ctx.moveTo(p1.x, clampY(p1.y));
                    ctx.lineTo(intersectX, intersectY);
                    ctx.lineTo(p2.x, clampY(p2.y));
                } else {
                    ctx.lineTo(intersectX, intersectY);
                    ctx.lineTo(p2.x, clampY(p2.y));
                }
            } 
            else {
                ctx.lineTo(p2.x, p2.y);
            }
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
