window.KnobModule = {
    createComponent(gen, key, min, max, isLog, syncCb) {
        const defVal = gen[key];
        const isDetuneKnob = (key === 'superDetune');

        return {
            dragging: false, startY: 0, startVal: 0,
            getRotation() {
                let v = gen[key], pct;
                if (isDetuneKnob) {
                    if (v <= 1.5) {
                        pct = (v / 1.5) * 0.5;
                    } else {
                        pct = 0.5 + ((v - 1.5) / (20 - 1.5)) * 0.5;
                    }
                    pct = Math.max(0, Math.min(1, pct));
                } else if (isLog) {
                    pct = (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
                } else {
                    pct = (v - min) / (max - min);
                }
                return (pct * 270) - 135;
            },
            resetKnob(e) {
                if (e) e.preventDefault(); 
                if (gen._defaults && gen._defaults[key] !== undefined) {
                    gen[key] = gen._defaults[key];
                } else {
                    gen[key] = defVal;
                }
                window.dispatchEvent(new CustomEvent('knob-reset'));
                syncCb(gen.id);
            },
            startDrag(e) {
                if (e.button === 2) return;
                this.dragging = true; 
                this.startY = e.pageY || e.touches.pageY; 
                this.startVal = gen[key];
                
                let startPct;
                if (isDetuneKnob) {
                    if (this.startVal <= 1.5) startPct = (this.startVal / 1.5) * 0.5;
                    else startPct = 0.5 + ((this.startVal - 1.5) / (20 - 1.5)) * 0.5;
                } else if (isLog) {
                    startPct = (Math.log(this.startVal) - Math.log(min)) / (Math.log(max) - Math.log(min));
                } else {
                    startPct = (this.startVal - min) / (max - min);
                }

                const move = (me) => {
                    if (!this.dragging) return;
                    let pctDelta = (this.startY - (me.pageY || me.touches.pageY)) / 200;
                    let nextPct = Math.max(0, Math.min(1, startPct + pctDelta));

                    if (isDetuneKnob) {
                        if (nextPct <= 0.5) {
                            gen[key] = parseFloat(((nextPct / 0.5) * 1.5).toFixed(4));
                        } else {
                            gen[key] = parseFloat((1.5 + ((nextPct - 0.5) / 0.5) * (20 - 1.5)).toFixed(4));
                        }
                    } else if (isLog) {
                        gen[key] = Math.round(Math.exp(Math.log(min) + nextPct * (Math.log(max) - Math.log(min))));
                    } else {
                        gen[key] = parseFloat((min + (nextPct * (max - min))).toFixed(4));
                    }

                    syncCb(gen.id);
                };

                const stop = () => {
                    if (!this.dragging) return;
                    this.dragging = false; 
                    
                    window.removeEventListener('mousemove', move); 
                    window.removeEventListener('mouseup', stop);
                    window.removeEventListener('touchmove', move);
                    window.removeEventListener('touchend', stop);
                    
                    syncCb(gen.id);
                };

                window.addEventListener('mousemove', move); 
                window.addEventListener('mouseup', stop);
                window.addEventListener('touchmove', move, { passive: false });
                window.addEventListener('touchend', stop);
            }
        };
    }
};
