window.ComponentModule_CustomWaveController = {
    updateAllCanvases(state, size, elements) {
        const table = state.customWaveTable;
        
        const renderCanvas = (canvasEl, isMain) => {
            if (!canvasEl) return;
            const ctx = canvasEl.getContext('2d');
            ctx.clearRect(0, 0, size, size);

            // Draw center gray 0-reference timeline
            ctx.strokeStyle = isMain ? '#27272a' : '#18181b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, size / 2);
            ctx.lineTo(size, size / 2);
            ctx.stroke();

            // Draw waveform path line
            ctx.strokeStyle = isMain ? '#22d3ee' : '#71717a';
            ctx.lineWidth = isMain ? 2.5 : 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();

            for (let i = 0; i < 1024; i++) {
                const pctX = i / 1023;
                const valY = table[i]; 
                const drawX = pctX * size;
                const drawY = (size / 2) - (valY * (size / 2 - 2));

                if (i === 0) ctx.moveTo(drawX, drawY);
                else ctx.lineTo(drawX, drawY);
            }
            ctx.stroke();
        };

        renderCanvas(elements.centerCanvas, true);
        renderCanvas(elements.leftCanvas, false);
        renderCanvas(elements.rightCanvas, false);
        this.renderTableData(elements.previewGrid, table);
    },

    handleDrawPosition(clientX, clientY, state, size, lastX, elements) {
        if (!elements.centerCanvas) return lastX;
        const rect = elements.centerCanvas.getBoundingClientRect();
        
        const currentX = Math.max(0, Math.min(size, clientX - rect.left));
        const currentY = Math.max(0, Math.min(size, clientY - rect.top));

        const normalizedValue = ((size / 2) - currentY) / (size / 2 - 2);
        const boundedValue = Math.max(-1.0, Math.min(1.0, normalizedValue));
        const targetTableIdx = Math.floor((currentX / size) * 1023);

        if (lastX === null) {
            state.customWaveTable[targetTableIdx] = boundedValue;
        } else {
            const startIdx = Math.min(lastX, targetTableIdx);
            const endIdx = Math.max(lastX, targetTableIdx);
            
            if (startIdx === endIdx) {
                state.customWaveTable[startIdx] = boundedValue;
            } else {
                const startVal = state.customWaveTable[lastX];
                for (let i = startIdx; i <= endIdx; i++) {
                    const interpolPct = (i - lastX) / (targetTableIdx - lastX);
                    state.customWaveTable[i] = startVal + (boundedValue - startVal) * interpolPct;
                }
            }
        }

        this.updateAllCanvases(state, size, elements);
        return targetTableIdx;
    },

    normalizeWave(state) {
        const table = state.customWaveTable;
        let maxVal = 0;

        for (let i = 0; i < 1024; i++) {
            const abs = Math.abs(table[i]);
            if (abs > maxVal) maxVal = abs;
        }

        if (maxVal > 0.0001) {
            const scaleFactor = 1.0 / maxVal;
            for (let i = 0; i < 1024; i++) {
                table[i] = table[i] * scaleFactor;
            }
        }
    },

    smoothWave(state) {
        const table = state.customWaveTable;
        const smoothed = new Float32Array(1024);
        const radius = 8;

        for (let i = 0; i < 1024; i++) {
            let sum = 0;
            for (let w = -radius; w <= radius; w++) {
                let idx = (i + w) % 1024;
                if (idx < 0) idx += 1024;
                sum += table[idx];
            }
            smoothed[i] = sum / (radius * 2 + 1);
        }
        state.customWaveTable = smoothed;
    },

    renderTableData(element, table) {
        if (!element) return;
        let htmlStr = '';
        for (let i = 0; i < 1024; i += 4) {
            htmlStr += `<div>[${String(i).padStart(3, '0')}]: ${table[i].toFixed(2)}</div>`;
        }
        element.innerHTML = htmlStr;
    }
};
