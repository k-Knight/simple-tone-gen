class ThreadedAudioEngine {
    constructor() {
        this.ctx = null;
        this.worker = null;
        this.leftQueue = [];
        this.rightQueue = [];
        this.bufferLength = 2048;
        this.maxQueueDepth = 3;
        this.savedMasterVolume = 0.5;

        // WAV Recording State Registers
        this.isRecording = false;
        this.recordedLeft = [];
        this.recordedRight = [];
        this.maxRecordSamples = 0;
        this.currentRecordSeconds = 2;

        this.isFlushing = false;
        this.latestScopeFrame = new Float32Array(800);
        this.scopeFrameQueue = [];

        // NATIVE HIGH-PERFORMANCE SCHEDULER SYSTEM REGISTERS
        this.nextScheduleTime = 0.0;     // Hardware C++ clock timeline tracking marker
        this.lookAheadInterval = 25;     // Scheduler evaluation frequency interval (ms)
        this.scheduleAheadTime = 0.12;   // Look-ahead buffer depth cushion target window (120ms)
        this.schedulerTimer = null;      // Native interval identifier handle
        this.activeSourcesPool = new Set(); // Retention pool prevents runtime JIT garbage sweeping
    }

    init() {
        if (this.ctx) return;

        this.ctx = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 48000,
            latencyHint: "interactive"
        });

        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.setValueAtTime(this.savedMasterVolume, this.ctx.currentTime);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.connect(this.masterGain);

        const compiledDspString = `
            self.AudioWorker = self.AudioWorker || {};
            self.AudioWorker.getWaveSample = ${window.AudioWorker.getWaveSample.toString()};
        `;

        const compiledScopeString = `
            self.AudioWorker = self.AudioWorker || {};
            self.AudioWorker.scopeState = "WAIT_HALF_PERIOD";
            self.AudioWorker.scopeTargetSamples = 0;
            self.AudioWorker.scopeSampleCounter = 0;
            self.AudioWorker.scopeStateCaptureStartTime = 0;
            self.AudioWorker.VISUAL_POINTS = 800;
            self.AudioWorker.resetScopeState = ${window.AudioWorker.resetScopeState.toString()};
            self.AudioWorker.processScopeWindow = ${window.AudioWorker.processScopeWindow.toString()};
        `;

        let serializedPluginsString = "self.AudioWorker = self.AudioWorker || {};\nself.AudioWorker.Plugins = {\n";
        for (let key in window.EffectRegistry) {
            if (typeof window.EffectRegistry[key] === 'function' || !window.EffectRegistry[key].process) {
                continue;
            }
            const fx = window.EffectRegistry[key];

            let rawProcessString = fx.process.toString().trim();
            if (rawProcessString.startsWith('process')) {
                rawProcessString = 'function' + rawProcessString.substring(7);
            }

            serializedPluginsString += `    "${key}": { process: ${rawProcessString} },\n`;
        }
        serializedPluginsString += "};\n";

        const rawFuncString = window.AudioWorkerTextModule.workerBody.toString();

        const cleanWorkerCode = rawFuncString.substring(
            rawFuncString.indexOf('{') + 1,
            rawFuncString.lastIndexOf('}')
        );

        const workerBlob = new Blob([
            compiledDspString, "\n",
            compiledScopeString, "\n",
            serializedPluginsString, "\n",
            cleanWorkerCode
        ], { type: 'application/javascript' });

        this.worker = new Worker(URL.createObjectURL(workerBlob));
        console.log("Worker Created Successfully via Native AudioBuffer Scheduling Engine");

        // NATIVE BRIDGE ARRIVAL LOGIC
        this.worker.onmessage = (e) => {
            if (!e.data) return;

            if (e.data.action === 'scope-update') {
                this.scopeFrameQueue.push(e.data.visualData);
                return;
            }

            const { leftChannel, rightChannel } = e.data;

            // 1. Pack data references directly into recording cache arrays if active
            if (this.isRecording) {
                if (this.recordedLeft.length * this.bufferLength < this.maxRecordSamples) {
                    this.recordedLeft.push(new Float32Array(leftChannel));
                    this.recordedRight.push(new Float32Array(rightChannel));
                } else {
                    this.isRecording = false;
                    window.dispatchEvent(new CustomEvent('record-finished'));
                }
            }

            // 2. Wrap raw background buffers into an explicit native browser AudioBuffer object container
            const nativeBuffer = this.ctx.createBuffer(2, this.bufferLength, this.ctx.sampleRate);
            nativeBuffer.getChannelData(0).set(leftChannel);
            nativeBuffer.getChannelData(1).set(rightChannel);

            // 3. Queue the native buffer node instantly into the hardware audio card stream timeline
            this.scheduleNativeBlock(nativeBuffer);

            if (this.isFlushing) {
                this.isFlushing = false;
                if (this.masterGain && this.ctx) {
                    this.masterGain.gain.setValueAtTime(this.savedMasterVolume, this.ctx.currentTime);
                }
            }
        };

        // Initialize the timeline baseline slightly ahead of the current audio timeline cursor clock
        this.nextScheduleTime = this.ctx.currentTime + 0.05;

        // Start the high-precision asynchronous browser lookahead ticking loop
        this.startSchedulerLoop();
    }

    startSchedulerLoop() {
        if (this.schedulerTimer) clearInterval(this.schedulerTimer);

        this.schedulerTimer = setInterval(() => {
            // Compute the remaining lookahead safety time window cushion currently sitting in memory
            let currentBufferedLookaheadSeconds = this.nextScheduleTime - this.ctx.currentTime;

            // Self-healing check: if playback lags or falls under target thresholds, flood requests to top up
            if (currentBufferedLookaheadSeconds < this.scheduleAheadTime) {
                this.worker.postMessage({ action: 'process', bufferLength: this.bufferLength });
            }
        }, this.lookAheadInterval);
    }

    scheduleNativeBlock(audioBuffer) {
        // Instantiate a native browser C++ streaming source node descriptor channel
        const sourceNode = this.ctx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(this.analyser);

        // Native lifecycle callback memory hook: cleanly eject node context references upon tracking completion
        sourceNode.onended = () => {
            sourceNode.disconnect();
            this.activeSourcesPool.delete(sourceNode);
        };
        this.activeSourcesPool.add(sourceNode);

        // Direct C++ thread hardware call command scheduling the slice at a specific microsecond timestamp
        sourceNode.start(this.nextScheduleTime);

        // Advance the tracking timeline by the exact mathematical step length of the buffer window segment
        const chunkDurationSeconds = this.bufferLength / this.ctx.sampleRate;
        this.nextScheduleTime += chunkDurationSeconds;
    }

    startRecording(seconds) {
        this.init();
        this.currentRecordSeconds = seconds;
        this.recordedLeft = [];
        this.recordedRight = [];
        this.maxRecordSamples = seconds * 48000;
        this.isRecording = true;
    }

    exportWav() {
        const totalSamples = Math.min(this.maxRecordSamples, this.recordedLeft.length * this.bufferLength);
        const buffer = new ArrayBuffer(44 + totalSamples * 4);
        const view = new DataView(buffer);

        const writeString = (offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + totalSamples * 4, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 3, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 48000, true);
        view.setUint32(28, 48000 * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 32, true);
        writeString(36, 'data');
        view.setUint32(40, totalSamples * 4, true);

        let offset = 44;
        for (let b = 0; b < this.recordedLeft.length; b++) {
            const chunk = this.recordedLeft[b];
            for (let s = 0; s < chunk.length; s++) {
                if (offset >= buffer.byteLength) break;
                view.setFloat32(offset, chunk[s], true);
                offset += 4;
            }
        }

        const blob = new Blob([view], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `combined-tone-${this.currentRecordSeconds}s.wav`;
        link.click();
    }

    addGenerator(id) {
        this.init();
        this.worker.postMessage({
            action: 'add',
            id: id,
            params: { type: 'sine', isInverted: false, frequency: 50, loudness: 0.25, pan: 0.0, timeShift: 0.0, isMuted: false, effects: [] }
        });
    }

    updateGenerator(id, p) {
        if (this.worker) {
            this.init();

            this.worker.postMessage({
                action: 'update',
                id: id,
                params: JSON.parse(JSON.stringify(p))
            });
        }
    }

    removeGenerator(id) { if (this.worker) this.worker.postMessage({ action: 'remove', id: id }); }
}

window.AudioEngineModule = {
    AudioEngine: ThreadedAudioEngine
};
