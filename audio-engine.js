class ThreadedAudioEngine {
    constructor() {
        this.ctx = null;
        this.worker = null;
        this.leftQueue = [];
        this.rightQueue = [];
        this.bufferLength = 2048;
        this.maxQueueDepth = 3;
        this.savedMasterVolume = 0.5;

        this.isRecording = false;
        this.recordedLeft = [];
        this.recordedRight = [];
        this.maxRecordSamples = 0;
        this.currentRecordSeconds = 2; 

        this.isFlushing = false;
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

        const blob = new Blob([window.AudioWorkerTextModule.code], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        this.worker.onmessage = (e) => {
            const { leftChannel, rightChannel } = e.data;
            this.leftQueue.push(leftChannel);
            this.rightQueue.push(rightChannel);
            
            if (this.isFlushing) {
                this.isFlushing = false;
                if (this.masterGain && this.ctx) {
                    this.masterGain.gain.setValueAtTime(this.savedMasterVolume, this.ctx.currentTime);
                }
            }
        };

        for (let i = 0; i < this.maxQueueDepth; i++) {
            this.worker.postMessage({ action: 'process', bufferLength: this.bufferLength });
        }

        this.processorNode = this.ctx.createScriptProcessor(this.bufferLength, 0, 2);
        this.processorNode.connect(this.analyser);

        this.processorNode.onaudioprocess = (audioEvent) => {
            const outputBuffer = audioEvent.outputBuffer;
            const leftOut = outputBuffer.getChannelData(0);
            const rightOut = outputBuffer.getChannelData(1);

            if (this.leftQueue.length > 0 && this.rightQueue.length > 0) {
                const lChunk = this.leftQueue.shift();
                const rChunk = this.rightQueue.shift();
                leftOut.set(lChunk);
                rightOut.set(rChunk);

                if (this.isRecording) {
                    if (this.recordedLeft.length * this.bufferLength < this.maxRecordSamples) {
                        this.recordedLeft.push(new Float32Array(lChunk));
                        this.recordedRight.push(new Float32Array(rChunk));
                    } else {
                        this.isRecording = false;
                        window.dispatchEvent(new CustomEvent('record-finished'));
                    }
                }
            } else {
                leftOut.fill(0);
                rightOut.fill(0);
            }

            if (this.leftQueue.length < this.maxQueueDepth) {
                this.worker.postMessage({ action: 'process', bufferLength: this.bufferLength });
            }
        };
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
