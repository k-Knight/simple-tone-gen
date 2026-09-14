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

            if (audioInstance.isFlushing) {
                ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
                return;
            }
            if (audioInstance.scopeFrameQueue?.length > 0) {
                if (audioInstance.scopeFrameQueue.length > 2) {
                    audioInstance.latestScopeFrame = audioInstance.scopeFrameQueue[audioInstance.scopeFrameQueue.length - 1];
                    audioInstance.scopeFrameQueue = [];
                } else {
                    audioInstance.latestScopeFrame = audioInstance.scopeFrameQueue.shift();
                }
            }
            if (audioInstance.latestScopeFrame) {
                const dataArray = audioInstance.latestScopeFrame;
                let maxVal = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    let absVal = Math.abs(dataArray[i]);
                    if (absVal > maxVal) maxVal = absVal;
                }
                let visualGain = maxVal > 0.001 ? (0.75 / maxVal) : 1.0;
                if (visualGain > 15) visualGain = 15;

                ctx.strokeStyle = '#38f8e2'; ctx.lineWidth = 2.5;
                ctx.beginPath();
                const displayPoints = dataArray.length;
                const sliceWidth = canvas.width / (displayPoints - 1);
                let x = 0;
                for (let i = 0; i < displayPoints; i++) {
                    let y = canvas.height / 2 + ((-dataArray[i] * visualGain) * (canvas.height / 2));
                    if (isNaN(y)) y = canvas.height / 2;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    x += sliceWidth;
                }
                ctx.stroke();
            }
        };
        renderLoop();
    }
};
