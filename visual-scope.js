window.VisualScopeModule = {
    draw(audioInstance) {
        const canvas = document.getElementById('scopeCanvas');
        if (!canvas) { requestAnimationFrame(() => this.draw(audioInstance)); return; }
        const ctx = canvas.getContext('2d');

        const renderLoop = () => {
            requestAnimationFrame(renderLoop);
            if (!canvas) return;

            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = '#1e1e24'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();

            if (audioInstance.visualBuffer) {
                const buffer = audioInstance.visualBuffer;

                let maxVal = 0;
                for (let i = 0; i < VISUAL_POINTS; i++) {
                    const absVal = Math.abs(buffer[i]);
                    if (absVal > maxVal) maxVal = absVal;
                }

                let visualGain = maxVal > 0.001 ? (0.75 / maxVal) : 1.0;
                if (visualGain > 15.0) visualGain = 15.0;

                ctx.strokeStyle = '#38f8e2'; ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();

                const sliceWidth = canvas.width / (VISUAL_POINTS - 1);
                let x = 0;

                for (let i = 0; i < VISUAL_POINTS; i++) {
                    const scaledSample = buffer[i] * visualGain;
                    
                    let y = (canvas.height / 2) - (scaledSample * (canvas.height / 2));

                    if (isNaN(y)) y = canvas.height / 2;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    
                    x += sliceWidth;
                }
                ctx.stroke();
            } else {
                ctx.strokeStyle = '#38f8e2'; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
            }
        };
        renderLoop();
    }
};