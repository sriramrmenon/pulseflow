
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pulseFlow', {

    // 1. Discover available cameras
    getCameras: () => {
        return ipcRenderer.invoke('get-cameras');
    },

    // 2. Start measurement with camera consent
    startMeasurement: (cameraId, consentGranted) => {
        return ipcRenderer.invoke(
            'start-measurement',
            cameraId,
            consentGranted
        );
    },

    // 3. Stop measurement
    stopMeasurement: () => {
        return ipcRenderer.invoke('stop-measurement');
    },

    // 4. Receive live breathing rate
    onBreathingRate: (callback) => {
        const listener = (_event, rate) => {
            callback(rate);
        };

        ipcRenderer.on('breathing-rate', listener);

        return () => {
            ipcRenderer.removeListener('breathing-rate', listener);
        };
    },

    // 5. Receive validation messages
    onValidationStatus: (callback) => {
        const listener = (_event, status) => {
            callback(status);
        };

        ipcRenderer.on('validation-status', listener);

        return () => {
            ipcRenderer.removeListener('validation-status', listener);
        };
    },

    // 6. Receive session status updates
    onSessionStatus: (callback) => {
        const listener = (_event, status) => {
            callback(status);
        };

        ipcRenderer.on('session-status', listener);

        return () => {
            ipcRenderer.removeListener('session-status', listener);
        };
    },

    // 7. Receive signal quality updates
    onSignalQuality: (callback) => {
        const listener = (_event, quality) => {
            callback(quality);
        };

        ipcRenderer.on('signal-quality', listener);

        return () => {
            ipcRenderer.removeListener('signal-quality', listener);
        };
    }

});
