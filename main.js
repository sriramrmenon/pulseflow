
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

import {
    SmartSpectraSDK,
    breathingMetrics,
    CameraSelection,
    decodeMetrics
} from '@smartspectra/node-sdk';

let mainWindow = null;
let sdk = null;
let isMeasuring = false;
let cleanupPromise = null;
let quitting = false;

let validationOK = false;
let lastValidMeasurement = 0;
let lastDisplayedMeasurement = 0;
let signalTimer = null;
let lastRecordedRate = null;
let lastObservedRate = null;
let lastQualityLogTime = 0;

// Added: track stale signal status
let signalIsStale = false;

// Send messages safely to the renderer
function sendToRenderer(channel, value) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, value);
    }
}

// Create the Electron window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 850,
        minWidth: 650,
        minHeight: 650,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(app.getAppPath(), 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;

        // Release camera resources when the window closes
        cleanupSDK().catch(error => {
            console.error('Window cleanup failed:', error.message);
        });
    });
}

// Discover cameras
ipcMain.handle('get-cameras', async () => {
    const cameras = await SmartSpectraSDK.availableCameras();

    return cameras.map(camera => ({
        id: camera.id,
        name: camera.name
    }));
});

// Start measurement
ipcMain.handle(
    'start-measurement',
    async (_event, cameraId, consentGranted) => {
        if (cleanupPromise) {
            await cleanupPromise;
        }

        if (isMeasuring || sdk) {
            throw new Error('A measurement session is already active.');
        }

        if (consentGranted !== true) {
            throw new Error('Camera consent is required.');
        }

        if (!process.env.SMARTSPECTRA_API_KEY) {
            throw new Error('SmartSpectra API key is missing.');
        }

        if (typeof cameraId !== 'string' || !cameraId) {
            throw new Error('Please select a valid camera.');
        }

        const cameras = await SmartSpectraSDK.availableCameras();
        const selectedCamera = cameras.find(
            camera => camera.id === cameraId
        );

        if (!selectedCamera) {
            throw new Error('The selected camera is unavailable.');
        }

        validationOK = false;
        lastValidMeasurement = Date.now();
        lastDisplayedMeasurement = 0;

        // Reset readings for a new session
        lastRecordedRate = null;
        lastObservedRate = null;

        // Added: reset stale state
        signalIsStale = false;

        sendToRenderer('session-status', 'starting');
        sendToRenderer('breathing-rate', null);
        sendToRenderer('signal-quality', 'Unavailable');
        sendToRenderer('validation-status', 'Initialising camera...');

        try {
            sdk = new SmartSpectraSDK({
                apiKey: process.env.SMARTSPECTRA_API_KEY,
                requestedMetrics: [...breathingMetrics]
            });

            sdk.useCamera(
                CameraSelection.byId(selectedCamera.id)
            );

            // SDK errors
            sdk.on('error', (code, message, retryable) => {
                console.error(
                    'SmartSpectra error:',
                    code,
                    message,
                    'Retryable:',
                    retryable
                );

                sendToRenderer(
                    'validation-status',
                    `SmartSpectra error: ${message}`
                );
            });

            // SDK processing status
            sdk.on('processingStatus', status => {
                console.log('Processing status:', status);
            });

            // Camera and signal validation
            sdk.on('validationStatus', (code, ts, hint) => {
                validationOK = code === 0;

                // Existing fallback positioning guidance
                const messages = {
                    0: 'Hold still and record.',
                    1: 'No face detected. Face the camera.',
                    2: 'Multiple faces detected. Only one person should be visible.',
                    3: 'Centre your face in the camera.',
                    4: 'Adjust your distance from the camera.',
                    5: 'The room is too dark. Improve the lighting.',
                    6: 'The lighting is too bright. Reduce direct light.',
                    7: 'Position the camera so more of your chest is visible.',
                    10: 'Camera is adjusting. Please wait.',
                    11: 'Camera frame rate is too low.',
                    12: 'Too much movement. Please hold still.',
                    13: 'Move further away from the camera.',
                    14: 'Move closer to the camera.',
                    15: 'Lower your face within the camera frame.',
                    16: 'Raise your face within the camera frame.',
                    17: 'Look directly towards the camera.'
                };

                const message =
                    hint || messages[code] ||
                    'Adjust your position and try again.';

                sendToRenderer('validation-status', message);

                if (!validationOK) {
                    // Keep the previous valid rate visible
                    sendToRenderer('signal-quality', 'Unstable');
                    lastDisplayedMeasurement = 0;
                }
            });

            // Live breathing measurements
            sdk.on('metrics', (buf, ts) => {
                try {
                    const metrics = decodeMetrics(buf);
                    const measurement = metrics?.breathing?.rate?.[0];

                    const rate = measurement?.value;
                    const stable = measurement?.stable;

                    // Store the latest numerical reading
                    if (Number.isFinite(rate)) {
                        lastObservedRate = Number(rate.toFixed(2));
                    }

                    const validMeasurement =
                        Number.isFinite(rate) &&
                        stable === true &&
                        validationOK;

                    const now = Date.now();

                    if (now - lastQualityLogTime >= 1000) {
                        console.log('Measurement quality:', {
                            rate,
                            stable,
                            validationOK,
                            validMeasurement
                        });

                        lastQualityLogTime = now;
                    }

                    // Ignore events without a breathing-rate value
                    if (!Number.isFinite(rate)) {
                        return;
                    }

                    // A numerical rate exists but has not passed validation
                    if (stable !== true || !validationOK) {
                        sendToRenderer('signal-quality', 'Unstable');

                        // General advice only when camera validation passes.
                        // Specific SDK positioning hints take priority.
                        if (validationOK) {
                            sendToRenderer(
                                'validation-status',
                                'Keep still, face the camera and ensure your upper chest is visible.'
                            );
                        }

                        return;
                    }

                    // Store the last valid, stable reading
                    lastRecordedRate = Number(rate.toFixed(2));
                    lastValidMeasurement = now;

                    // Added: fresh valid signal received
                    signalIsStale = false;

                    sendToRenderer('signal-quality', 'Stable');

                    // Limit displayed readings to once per second
                    if (now - lastDisplayedMeasurement >= 1000) {
                        sendToRenderer(
                            'breathing-rate',
                            Number(rate.toFixed(2))
                        );

                        lastDisplayedMeasurement = now;
                    }

                } catch (error) {
                    console.error(
                        'Unable to process breathing metrics:',
                        error.message
                    );

                    sendToRenderer('breathing-rate', lastRecordedRate);
                    sendToRenderer('signal-quality', 'Unavailable');
                }
            });

            sdk.start();
            isMeasuring = true;

            // Updated: retain last valid reading when signal becomes stale
            signalTimer = setInterval(() => {
                if (
                    isMeasuring &&
                    !signalIsStale &&
                    Date.now() - lastValidMeasurement > 5000
                ) {
                    signalIsStale = true;

                    sendToRenderer(
                        'breathing-rate',
                        lastRecordedRate
                    );

                    sendToRenderer(
                        'signal-quality',
                        lastRecordedRate !== null
                            ? 'Last valid reading'
                            : 'Unavailable'
                    );

                    sendToRenderer(
                        'validation-status',
                        'Waiting for a fresh breathing signal. Keep still, face the camera and ensure your upper chest is visible.'
                    );
                }
            }, 2000);

            sendToRenderer('session-status', 'measuring');

            console.log(
                'Measurement started using:',
                selectedCamera.name
            );

            return { success: true };

        } catch (error) {
            console.error(
                'Unable to start measurement:',
                error.message
            );

            await cleanupSDK();

            sendToRenderer('session-status', 'error');
            sendToRenderer('validation-status', error.message);

            throw error;
        }
    }
);

// Shared SDK cleanup
async function cleanupSDK() {
    if (cleanupPromise) {
        return cleanupPromise;
    }

    cleanupPromise = (async () => {
        let cleanupError = null;

        if (signalTimer) {
            clearInterval(signalTimer);
            signalTimer = null;
        }

        try {
            if (sdk && isMeasuring) {
                await sdk.stopAsync();
            }
        } catch (error) {
            console.error(
                'Unable to stop measurement:',
                error.message
            );

            cleanupError = error;

        } finally {
            isMeasuring = false;

            if (sdk) {
                try {
                    await sdk.destroy();
                    sdk = null;
                } catch (error) {
                    console.error(
                        'Unable to destroy SDK:',
                        error.message
                    );

                    cleanupError = cleanupError || error;
                }
            }

            validationOK = false;
            lastValidMeasurement = 0;
            lastDisplayedMeasurement = 0;
            signalIsStale = false;

            // Retain the last valid or observed reading
            const finalRate = lastRecordedRate ?? lastObservedRate;

            sendToRenderer('breathing-rate', finalRate);

            sendToRenderer(
                'signal-quality',
                lastRecordedRate !== null
                    ? 'Last valid reading'
                    : lastObservedRate !== null
                        ? 'Unverified'
                        : 'Unavailable'
            );

            sendToRenderer('session-status', 'idle');

            sendToRenderer(
                'validation-status',
                'Measurement stopped.'
            );
        }

        if (cleanupError) {
            throw cleanupError;
        }
    })();

    try {
        await cleanupPromise;
    } finally {
        cleanupPromise = null;
    }
}

// Stop measurement
ipcMain.handle('stop-measurement', async () => {
    sendToRenderer('session-status', 'stopping');

    await cleanupSDK();

    return { success: true };
});

// Electron application lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Attempt SDK cleanup before application exit
app.on('before-quit', event => {
    if (quitting) {
        return;
    }

    event.preventDefault();

    cleanupSDK()
        .catch(error => {
            console.error('Shutdown cleanup failed:', error.message);
        })
        .finally(() => {
            quitting = true;
            app.quit();
        });
});
