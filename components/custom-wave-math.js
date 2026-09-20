window.ComponentModule_CustomWaveMath = {
    calculateTangents(nodes, tension) {
        const numNodes = nodes.length;
        const tangents = new Float32Array(numNodes);
        
        for (let i = 0; i < numNodes; i++) {
            if (i === 0) {
                tangents[i] = (nodes[1].y - nodes[0].y) / Math.max(0.0001, nodes[1].x - nodes[0].x);
            } else if (i === numNodes - 1) {
                tangents[i] = (nodes[numNodes - 1].y - nodes[numNodes - 2].y) / Math.max(0.0001, nodes[numNodes - 1].x - nodes[numNodes - 2].x);
            } else {
                const dx1 = nodes[i].x - nodes[i - 1].x;
                const dx2 = nodes[i + 1].x - nodes[i].x;
                const slope1 = (nodes[i].y - nodes[i - 1].y) / Math.max(0.0001, dx1);
                const slope2 = (nodes[i + 1].y - nodes[i].y) / Math.max(0.0001, dx2);
                tangents[i] = (slope1 + slope2) * 0.5;
            }
            tangents[i] *= (1.0 - tension);
        }
        return tangents;
    },
    
    calculateTangents(nodes, tension, state) {
        const numNodes = nodes.length;
        const tangents = new Float32Array(numNodes);
        const dontLoopSmoothing = state ? state.useSplineSmoothing !== true : false;
        
        for (let i = 0; i < numNodes; i++) {
            if (dontLoopSmoothing && i === 0) {
                tangents[i] = (nodes[1].y - nodes[0].y) / Math.max(0.0001, nodes[1].x - nodes[0].x);
            } else if (dontLoopSmoothing && i === numNodes - 1) {
                tangents[i] = (nodes[numNodes - 1].y - nodes[numNodes - 2].y) / Math.max(0.0001, nodes[numNodes - 1].x - nodes[numNodes - 2].x);
            } else {
                const idx_prev = dontLoopSmoothing ? i - 1 : (i === 0 ? numNodes - 1 : i - 1);
                const idx_next = dontLoopSmoothing ? i + 1 : ((i + 1) % numNodes);

                const dx1 = Math.max(0.001, nodes[i].x - nodes[idx_prev].x);
                const dx2 = Math.max(0.001, nodes[idx_next].x - nodes[i].x);
                const slope1 = (nodes[i].y - nodes[idx_prev].y) / Math.max(0.0001, dx1);
                const slope2 = (nodes[idx_next].y - nodes[i].y) / Math.max(0.0001, dx2);
                tangents[i] = (slope1 + slope2) * 0.5;
            }
            tangents[i] *= (1.0 - tension);
        }
        return tangents;
    },

    sampleSpline(targetX, nodes, tangents, tension) {
        const numNodes = nodes.length;
        let idx = 0;
        
        for (let n = 0; n < numNodes - 1; n++) {
            if (targetX >= nodes[n].x && targetX <= nodes[n + 1].x) {
                idx = n;
                break;
            }
        }

        const n1 = nodes[idx];
        const n2 = nodes[idx + 1];
        const h = Math.max(0.0001, n2.x - n1.x);
        const t = (targetX - n1.x) / h;

        if (tension >= 0.999) {
            return n1.y + (n2.y - n1.y) * t;
        }

        const t2 = t * t;
        const t3 = t2 * t;

        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        return h00 * n1.y + h10 * h * tangents[idx] + h01 * n2.y + h11 * h * tangents[idx + 1];
    },

    findTruePeak(nodes, tangents, tension) {
        let absolutePeak = 0.0001;
        const checkValue = (val) => {
            const abs = Math.abs(val);
            if (abs > absolutePeak) absolutePeak = abs;
        };

        for (let i = 0; i < nodes.length - 1; i++) {
            const n1 = nodes[i];
            const n2 = nodes[i + 1];
            const h = Math.max(0.0001, n2.x - n1.x);

            checkValue(n1.y);
            checkValue(n2.y);

            if (tension >= 0.999) continue;

            const y1 = n1.y;
            const y2 = n2.y;
            const t1 = tangents[i] * h;
            const t2 = tangents[i + 1] * h;

            const c3 = 2 * y1 + t1 - 2 * y2 + t2;
            const c2 = -3 * y1 - 2 * t1 + 3 * y2 - t2;
            const c1 = t1;

            const A = 3 * c3;
            const B = 2 * c2;
            const C = c1;

            if (Math.abs(A) < 0.00001) {
                if (Math.abs(B) > 0.00001) {
                    const tExtremum = -C / B;
                    if (tExtremum > 0 && tExtremum < 1) {
                        checkValue(c3 * Math.pow(tExtremum, 3) + c2 * Math.pow(tExtremum, 2) + c1 * tExtremum + y1);
                    }
                }
            } else {
                const discriminant = B * B - 4 * A * C;
                if (discriminant >= 0) {
                    const sqrtDisc = Math.sqrt(discriminant);
                    const tRoot1 = (-B + sqrtDisc) / (2 * A);
                    const tRoot2 = (-B - sqrtDisc) / (2 * A);

                    if (tRoot1 > 0 && tRoot1 < 1) {
                        checkValue(c3 * Math.pow(tRoot1, 3) + c2 * Math.pow(tRoot1, 2) + c1 * tRoot1 + y1);
                    }
                    if (tRoot2 > 0 && tRoot2 < 1) {
                        checkValue(c3 * Math.pow(tRoot2, 3) + c2 * Math.pow(tRoot2, 2) + c1 * tRoot2 + y1);
                    }
                }
            }
        }
        return absolutePeak;
    }
};
