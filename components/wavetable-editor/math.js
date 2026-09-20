window.ComponentModule_CustomWaveMath = {
    calculateTangents(nodes, tension, state) {
        const numNodes = nodes.length;
        const tangents = new Float32Array(numNodes);
        const dontLoopSmoothing = state ? state.useSplineSmoothing !== true : false;
        const lockEndsTogether = state ? state.lockEndsTogether === true : false;

        for (let i = 0; i < numNodes; i++) {
            if (dontLoopSmoothing && i === 0) {
                tangents[i] = (nodes[1].y - nodes[0].y) / Math.max(0.0001, nodes[1].x - nodes[0].x);
            } else if (dontLoopSmoothing && i === numNodes - 1) {
                tangents[i] = (nodes[numNodes - 1].y - nodes[numNodes - 2].y) / Math.max(0.0001, nodes[numNodes - 1].x - nodes[numNodes - 2].x);
            } else {
                let idx_prev, idx_next;

                if (i === 0) {
                    idx_prev = lockEndsTogether ? Math.max(0, numNodes - 2) : numNodes - 1;
                    idx_next = 1;
                } else if (i === numNodes - 1) {
                    idx_prev = numNodes - 2;
                    idx_next = lockEndsTogether ? Math.min(numNodes - 1, 1) : 0;
                } else {
                    idx_prev = i - 1;
                    idx_next = i + 1;
                }

                let dx1 = nodes[i].x - nodes[idx_prev].x;
                if (dx1 <= 0) dx1 += 1.0;
                dx1 = Math.max(0.001, dx1);

                let dx2 = nodes[idx_next].x - nodes[i].x;
                if (dx2 <= 0) dx2 += 1.0;
                dx2 = Math.max(0.001, dx2);

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

    findTrueExtrema(nodes, tangents, tension) {
        let absoluteMin = Infinity;
        let absoluteMax = -Infinity;

        const checkValue = (val) => {
            if (val < absoluteMin) absoluteMin = val;
            if (val > absoluteMax) absoluteMax = val;
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

        if (absoluteMin === Infinity) {
            absoluteMin = -0.0001;
            absoluteMax = 0.0001;
        }

        return { min: absoluteMin, max: absoluteMax };
    }
};
