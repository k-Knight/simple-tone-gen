window.ComponentModule_KnobMath = {
    getRotation(v, min, max, isLog) {
        let pct;
        if (isLog && min > 0 && max > 0) {
            const safeMin = min;
            const safeV = Math.max(safeMin, v);
            pct = (Math.log(safeV) - Math.log(safeMin)) / (Math.log(max) - Math.log(safeMin));
        } else {
            pct = (v - min) / (max - min);
        }
        pct = Math.max(0, Math.min(1, pct));
        return (pct * 270) - 135;
    },

    getDisplayPrecision(value, stepDecimals, isLog) {
        if (isLog && value > 0) {
            const absCalc = Math.abs(value);
            if (absCalc >= 100) return 0;
            if (absCalc > 10) return 1;
            if (absCalc > 1) return 2;
            if (absCalc > 0.1) return 3;
            return 4;
        }
        return stepDecimals;
    },

    calculateValueFromPct(pct, min, max, isLog) {
        if (isLog) {
            const range = max - min;
            if (Math.abs(range) < 0.00001) return min;

            const logCurvePct = (Math.pow(1.5, pct) - 1.0) / 0.5;
            return min + (logCurvePct * range);
        }

        return min + (pct * (max - min));
    }
};
