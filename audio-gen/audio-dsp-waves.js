(function () {
    function getOriginalMax(damping) {
        const sqrtK2Plus1 = Math.sqrt(damping * damping + 1);
        const coeff = Math.sqrt(2 * (sqrtK2Plus1 - 1)) / damping;
        const exponent = -(damping + 1 - sqrtK2Plus1) / 2;
        return coeff * Math.exp(exponent);
    }

    const scope = typeof window !== 'undefined' ? window : self;
    scope.AudioWorker = scope.AudioWorker || {};

    const scaleCache = new Map();

    scope.AudioWorker.getWaveSample = function (type, angle, t, frequency, k, pow) {
        const x = ((angle / (2 * Math.PI)) % 1 + 1) % 1;
        let val = 0;

        if (type === 'sine') {
            val = Math.sin(angle);
        } else if (type === 'square') {
            val = x < (k / 10 + 0.45) % 1 ? 1.0 : -1.0;
        } else if (type === 'sawtooth') {
            const tri = ((angle % (2 * Math.PI)) / Math.PI - 1) * 2;
            const slopeFactor = Math.max(k * 1.0, 0.5);
            val = Math.max(-1, Math.min(1, tri * slopeFactor));
        } else if (type === 'triangle') {
            val = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
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
            val = 2.0 * (Math.sin(angle) * Math.abs(Math.cos(angle)));
        } else if (type === 'trapezoid') {
            const tri = 1.0 - 4.0 * Math.abs(Math.round(x) - x);
            const steepness = 1.0 + (k * 2.0);
            val = Math.max(-1, Math.min(1, tri * steepness));
        } else if (type === 'pulse') {
            let currentScale = scaleCache.get(k);
            if (currentScale === undefined) {
                const originalMaxK = getOriginalMax(k);
                currentScale = originalMaxK > 0 ? (1.0 / originalMaxK) : 1.0;
                scaleCache.set(k, currentScale);
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
