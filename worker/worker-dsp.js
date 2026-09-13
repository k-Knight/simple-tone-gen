(function() {
    const scope = typeof window !== 'undefined' ? window : self;
    scope.AudioWorker = scope.AudioWorker || {};

    scope.AudioWorker.getWaveSample = function(type, angle, t, frequency) {
        if (type === 'sine') return Math.sin(angle);
        if (type === 'square') return Math.sin(angle) >= 0 ? 1 : -1;
        if (type === 'sawtooth') return 2 * (t * frequency - Math.floor(0.5 + t * frequency));
        if (type === 'triangle') return 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
        return 0;
    };
})();