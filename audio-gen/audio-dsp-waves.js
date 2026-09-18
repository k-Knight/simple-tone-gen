(function () {
    function getPulseYMax(damping) {
        const sqrtK2Plus1 = Math.sqrt(damping * damping + 1);
        const coeff = Math.sqrt(2 * (sqrtK2Plus1 - 1)) / damping;
        const exponent = -(damping + 1 - sqrtK2Plus1) / 2;
        return coeff * Math.exp(exponent);
    }

    function getCamelYMax(b) {
        let ymax = 0;

        const steps = 120;
        let bestIdx = 0;
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * 6.283185307179586;
            const y = Math.abs(Math.sin(a)) * Math.abs(Math.cos(b * a));
            if (y > ymax) {
                ymax = y;
                bestIdx = i;
            }
        }

        let low = Math.max(0, ((bestIdx - 1) / steps) * 6.283185307179586);
        let high = Math.min(6.283185307179586, ((bestIdx + 1) / steps) * 6.283185307179586);

        for (let iter = 0; iter < 40; iter++) {
            const mid = (low + high) * 0.5;
            const cosBA = Math.cos(b * mid);

            const slope = (Math.sin(mid) >= 0 ? 1 : -1) * (cosBA >= 0 ? 1 : -1) *
                (Math.cos(mid) * cosBA - b * Math.sin(mid) * Math.sin(b * mid));

            if (slope > 0) low = mid;
            else high = mid;
        }

        const finalA = (low + high) * 0.5;
        return Math.abs(Math.sin(finalA)) * Math.abs(Math.cos(b * finalA));
    }

    const scope = typeof window !== 'undefined' ? window : self;
    scope.AudioWorker = scope.AudioWorker || {};

    const pulseScaleCache = new Map();
    const camelScaleCache = new Map();
    const TWO_PI = 6.283185307179586;

    scope.AudioWorker.getWaveSample = function (type, angle, k, pow) {
        angle = angle % TWO_PI;
        angle = (angle + TWO_PI) % TWO_PI;
        const x = angle / TWO_PI;

        let val = 0;

        if (type === 'sine') {
            const sinPart = Math.sin(angle);

            if (Math.abs(k) < 0.0001) {
                val = sinPart;
            } else {
                const cosPart = Math.cos(angle);
                const absT = Math.abs(k);
                const t1 = Math.asin(absT) / absT;

                const numerator = k * sinPart;
                const denominator = 1.0 - (k * cosPart);
                const rawWarped = Math.atan2(numerator, denominator);

                val = (1.0 / (k * t1)) * rawWarped;
            }
        } else if (type === 'square') {
            val = x < k % 1 ? 1.0 : -1.0;
        } else if (type === 'sawtooth') {
            const tri = ((angle % (2 * Math.PI)) / Math.PI - 1) * 2;
            val = Math.max(-1, Math.min(1, tri * k));
        } else if (type === 'triangle') {
            const tri = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
            const steepness = 1.0 + (k * 2.0);
            val = Math.max(-1, Math.min(1, tri * steepness));
        } else if (type === 'sharktooth') {
            const x = angle / (2 * Math.PI);

            const mod1 = ((2 * x - 1) % 2 + 2) % 2 - 2;
            const inner1 = 1.0 - (mod1 * mod1);
            const y1 = inner1 >= 0 ? 2 * Math.pow(inner1, k) - 1 : 0;

            const mod2 = (2 * x % 2 + 2) % 2 - 2;
            const inner2 = 1.0 - (mod2 * mod2);
            const y2 = inner2 >= 0 ? -2 * Math.pow(inner2, k) + 1 : 0;

            val = y1 + y2;
        } else if (type === 'scallop') {
            const mod = (x * 2.0) - 1.0;
            const inner = 1.0 - (mod * mod);
            val = inner >= 0 ? 2.0 * Math.pow(inner, k) - 1.0 : -1.0;
        } else if (type === 'sharkfin') {
            val = Math.pow(x, k) * 2.0 - 1.0;
        } else if (type === 'camel') {
            let currentScale = camelScaleCache.get(k);
            if (currentScale === undefined) {
                const yMax = getCamelYMax(k);
                currentScale = yMax > 0 ? (1.0 / yMax) : 1.0;
                camelScaleCache.set(k, currentScale);
            }

            val = currentScale * (Math.sin(angle) * Math.abs(Math.cos(angle * k)));
        } else if (type === 'pulse') {
            let currentScale = pulseScaleCache.get(k);
            if (currentScale === undefined) {
                const yMax = getPulseYMax(k);
                currentScale = yMax > 0 ? (1.0 / yMax) : 1.0;
                pulseScaleCache.set(k, currentScale);
            }

            const sinPiX = Math.sin(angle * 0.5);
            val = Math.sin(angle) * Math.pow(sinPiX * sinPiX, k) * currentScale;
        }

        if (Math.abs(pow - 1.0) > 0.00001) {
            return Math.sign(val) * Math.pow(Math.abs(val), pow);
        }

        return val;
    };
})();
