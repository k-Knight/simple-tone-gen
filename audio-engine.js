class UnifiedAudioEngine {
    constructor() {
        this.ctx = null;
        this.bufferLength = 2048;
        this.savedMasterVolume = 0.5;

        // Context Engine State
        this.generators = new Map();
        this.smoothState = new Map();
        this.phaseTimeline = 0;

        // WAV Recording Registers
        this.isRecording = false;
        this.recordedLeft = [];
        this.recordedRight = [];
        this.maxRecordSamples = 0;
        this.currentRecordSeconds = 2;

        // Scheduler Properties
        this.nextScheduleTime = 0.0;
        this.lookAheadInterval = 25;
        this.scheduleAheadTime = 0.12;
        this.schedulerTimer = null;
        this.activeSourcesPool = new Set();
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

        this.nextScheduleTime = this.ctx.currentTime + 0.05;
        this.startSchedulerLoop();
    }

    startSchedulerLoop() {
        if (this.schedulerTimer) clearInterval(this.schedulerTimer);

        this.schedulerTimer = setInterval(() => {
            let currentBufferedLookaheadSeconds = this.nextScheduleTime - this.ctx.currentTime;

            while (currentBufferedLookaheadSeconds < this.scheduleAheadTime) {
                this.calculateAndScheduleBlock();
                currentBufferedLookaheadSeconds = this.nextScheduleTime - this.ctx.currentTime;
            }
        }, this.lookAheadInterval);
    }

    calculateAndScheduleBlock() {
        const leftChannel = new Float32Array(this.bufferLength);
        const rightChannel = new Float32Array(this.bufferLength);

        // Forward state context over to the isolated DSP module math loop
        window.AudioDspModule.calculateBlock(this, this.bufferLength, leftChannel, rightChannel, 48000);

        if (this.isRecording) {
            if (this.recordedLeft.length * this.bufferLength < this.maxRecordSamples) {
                this.recordedLeft.push(new Float32Array(leftChannel));
                this.recordedRight.push(new Float32Array(rightChannel));
            } else {
                this.isRecording = false;
                window.dispatchEvent(new CustomEvent('record-finished'));
            }
        }

        const nativeBuffer = this.ctx.createBuffer(2, this.bufferLength, this.ctx.sampleRate);
        nativeBuffer.getChannelData(0).set(leftChannel);
        nativeBuffer.getChannelData(1).set(rightChannel);

        const sourceNode = this.ctx.createBufferSource();
        sourceNode.buffer = nativeBuffer;
        sourceNode.connect(this.analyser);

        sourceNode.onended = () => {
            sourceNode.disconnect();
            this.activeSourcesPool.delete(sourceNode);
        };
        this.activeSourcesPool.add(sourceNode);

        sourceNode.start(this.nextScheduleTime);
        this.nextScheduleTime += (this.bufferLength / this.ctx.sampleRate);
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
        this.generators.set(id, { type: 'sine', isInverted: false, frequency: 50, loudness: 0.25, pan: 0.0, timeShift: 0.0, isMuted: false, effects: [] });

        if (window.AudioWorker && window.AudioWorker.resetScopeState) {
            window.AudioWorker.resetScopeState(this.generators, 48000);
        }
    }

    updateGenerator(id, p) {
        this.init();
        this.generators.set(id, JSON.parse(JSON.stringify(p)));

        if (window.AudioWorker && window.AudioWorker.resetScopeState) {
            window.AudioWorker.resetScopeState(this.generators, 48000);
        }
    }
    removeGenerator(id) {
        this.generators.delete(id);
        this.smoothState.delete(id);
        if (window.AudioWorker && window.AudioWorker.resetScopeState) {
            window.AudioWorker.resetScopeState(this.generators, 48000);
        }
    }
}

window.AudioEngineModule = { AudioEngine: UnifiedAudioEngine };
