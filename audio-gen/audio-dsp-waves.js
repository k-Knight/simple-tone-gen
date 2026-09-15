(function() {
    const scope = typeof window !== 'undefined' ? window : self;
    scope.AudioWorker = scope.AudioWorker || {};

    scope.AudioWorker.getWaveSample = function(type, angle, t, frequency) {
        const x = ((angle / (2 * Math.PI)) % 1 + 1) % 1;

        if (type === 'sine') {
            return Math.sin(angle);
        }
        
        if (type === 'square') {
            return x < 0.5 ? 1.0 : -1.0;
        }
        
        if (type === 'sawtooth') {
            return 2.0 * x - 1.0;
        }
        
        if (type === 'triangle') {
            return 1.0 - 4.0 * Math.abs(Math.round(x) - x);
        }

        if (type === 'sharktooth') {
            const x = angle / (2 * Math.PI);

            const mod1 = ((2 * x - 1) % 2 + 2) % 2 - 2;
            const inner1 = 1.0 - (mod1 * mod1);
            const y1 = inner1 >= 0 ? 2 * Math.sqrt(inner1) - 1 : 0;

            const mod2 = (2 * x % 2 + 2) % 2 - 2;
            const inner2 = 1.0 - (mod2 * mod2);
            const y2 = inner2 >= 0 ? -2 * Math.sqrt(inner2) + 1 : 0;

            return y1 + y2;
        }
        
        if (type === 'scallop') {
            const mod = (x * 2.0) - 1.0;
            const inner = 1.0 - (mod * mod);
            return inner >= 0 ? 2.0 * Math.sqrt(inner) - 1.0 : -1.0;
        }
        
        if (type === 'sharkfin') {
            return Math.pow(x, 0.3) * 2.0 - 1.0;
        }
        
        if (type === 'camel') {
            return 2.0 * (Math.sin(angle) * Math.abs(Math.cos(angle)));
        }
        
        if (type === 'razorback') {
            const rawTri = 1.0 - 4.0 * Math.abs(Math.round(x) - x); // Balanced triangle base [-1, 1]
            return Math.sign(rawTri) * Math.pow(Math.abs(rawTri), 3.0);
        }
        
        if (type === 'trapezoid') {
            const tri = ((angle % (2 * Math.PI)) / Math.PI - 1) * 2;
            return Math.max(-1, Math.min(1, tri * 1.5));
        }

        return 0;
    };
})();
