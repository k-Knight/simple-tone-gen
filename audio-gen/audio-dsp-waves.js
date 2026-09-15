//(function() {
//    const scope = typeof window !== 'undefined' ? window : self;
//    scope.AudioWorker = scope.AudioWorker || {};
//
//    scope.AudioWorker.getWaveSample = function(type, angle, t, frequency) {
//        if (type === 'sine') return Math.sin(angle);
//        if (type === 'square') return Math.sin(angle) >= 0 ? 1 : -1;
//        if (type === 'sawtooth') return 2 * (t * frequency - Math.floor(0.5 + t * frequency));
//        if (type === 'triangle') return 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
//        if (type === 'sharktooth') {
//            const x = angle / (2 * Math.PI);
//
//            const mod1 = ((2 * x - 1) % 2 + 2) % 2 - 2;
//            const inner1 = 1.0 - (mod1 * mod1);
//            const y1 = inner1 >= 0 ? 2 * Math.sqrt(inner1) - 1 : 0;
//
//            const mod2 = (2 * x % 2 + 2) % 2 - 2;
//            const inner2 = 1.0 - (mod2 * mod2);
//            const y2 = inner2 >= 0 ? -2 * Math.sqrt(inner2) + 1 : 0;
//
//            return y1 + y2;
//        }
//        if (type === 'scallop') {
//            const x = angle / (2 * Math.PI);
//
//            const mod = ((2 * x) % 2 + 2) % 2 - 1;
//            const inner = 1.0 - (mod * mod);
//
//            return inner >= 0 ? 2 * Math.sqrt(inner) - 1 : -1;
//        }
//        if (type === 'sharkfin') {
//            const x = (angle / (2 * Math.PI)) % 1;
//            return Math.pow(x, 0.3) * 2 - 1;
//        }
//        if (type === 'camel') {
//            return Math.sin(angle) * Math.abs(Math.cos(angle));
//        }
//        if (type === 'razorback') {
//            const normTri = Math.abs((angle % (2 * Math.PI)) / Math.PI - 1) * 2 - 1;
//            return Math.sign(normTri) * Math.pow(Math.abs(normTri), 3);
//        }
//        if (type === 'trapezoid') {
//            const tri = ((angle % (2 * Math.PI)) / Math.PI - 1) * 2;
//            return Math.max(-1, Math.min(1, tri * 1.5));
//        }
//        return 0;
//    };
//})();

(function() {
    const scope = typeof window !== 'undefined' ? window : self;
    scope.AudioWorker = scope.AudioWorker || {};

    scope.AudioWorker.getWaveSample = function(type, angle, t, frequency) {
        // Create a high-precision normalized phase tracker running safely from [0.0 to 1.0)
        // This ensures Haas delay angle rotations and Unison steps map perfectly on all shapes
        const x = ((angle / (2 * Math.PI)) % 1 + 1) % 1;

        // --- 1. THE CLASSIC MONSTERS ---
        if (type === 'sine') {
            return Math.sin(angle);
        }
        
        if (type === 'square') {
            return x < 0.5 ? 1.0 : -1.0;
        }
        
        if (type === 'sawtooth') {
            // FIXED: Migrated from 't * frequency' to the unified continuous angle coordinate
            return 2.0 * x - 1.0;
        }
        
        if (type === 'triangle') {
            // FIXED: Anchored to angle space, making it perfectly responsive to Haas time shifts
            return 1.0 - 4.0 * Math.abs(Math.round(x) - x);
        }

        // --- 2. THE GEOMETRIC ZOO BEASTS ---
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
            // Pristine balanced exponential ramp
            return Math.pow(x, 0.3) * 2.0 - 1.0;
        }
        
        if (type === 'camel') {
            // FIXED: Multiplied by a scaling amplitude factor of 2.0 to stretch its volume peak
            // out to a true balanced range of -1.0 to 1.0 matching your master volume headroom.
            return 2.0 * (Math.sin(angle) * Math.abs(Math.cos(angle)));
        }
        
        if (type === 'razorback') {
            // FIXED: Removed the range squashing by normalizing the internal triangle vector 
            // prior to applying the power multiplier, creating razor-sharp needles at full volume.
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
