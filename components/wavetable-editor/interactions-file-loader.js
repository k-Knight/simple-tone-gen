window.ComponentModule_CustomWaveInteractionsFileLoader = {
    bind(standaloneContext, elements, size, ctrl, triggerReset, refreshLock) {
        if (!elements.fileBtn || !elements.fileInput) return;

        elements.fileBtn.addEventListener('click', () => elements.fileInput.click());

        elements.fileInput.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            try {
                const arrayBuffer = await files[0].arrayBuffer();
                const offlineCtx = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);

                const rawSamples = audioBuffer.getChannelData(0);

                standaloneContext.rawFileBuffer = new Float32Array(rawSamples);
                standaloneContext.importMode = 'file';

                refreshLock(standaloneContext, elements);
                ctrl.updateAllCanvases(standaloneContext, size, elements);
                triggerReset();
            } catch (err) {
                console.error("WAV parsing failure:", err);
                alert("Error reading WAV file. Ensure it is a valid audio file.");
            }
        });
    },

    exportWavetable(standaloneContext, containerEl) {
        const tableData = standaloneContext.customWaveTable;
        if (!tableData || tableData.length === 0) return;

        const totalSamples = tableData.length;
        const targetSampleRate = 44100;

        const buffer = new ArrayBuffer(44 + totalSamples * 4);
        const view = new DataView(buffer);

        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + totalSamples * 4, true);
        writeString(8, 'WAVE');

        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 3, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, targetSampleRate, true);
        view.setUint32(28, targetSampleRate * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 32, true);

        writeString(36, 'data');
        view.setUint32(40, totalSamples * 4, true);

        let offset = 44;
        for (let i = 0; i < totalSamples; i++) {
            const sample = Math.max(-1.0, Math.min(1.0, tableData[i]));
            view.setFloat32(offset, sample, true);
            offset += 4;
        }

        const nameInput = containerEl.querySelector('#wavetableNameInput');
        const fileName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'custom-wavetable';

        const blob = new Blob([view], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName.toLowerCase().replace(/\s+/g, '-')}-${totalSamples}.wav`;
        link.click();
        URL.revokeObjectURL(url);
    }
};
