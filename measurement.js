
import {
    SmartSpectraSDK,
    breathingMetrics,
    CameraSelection,
    decodeMetrics
} from '@smartspectra/node-sdk';

let sdk;
let isMeasuring = false;
let validationOK = false;
let cleanupPromise = null;

// Allow menu to check measurement state
export function measurementIsRunning() {
    return isMeasuring;
}

// Start SmartSpectra measurement
export async function startMeasurement(selectedCamera) {
    console.log('Starting measurement...');
    console.log('Starting SmartSpectra measurement...');
    console.log('Select option 2 to stop the measurement.');

    if (cleanupPromise) {
        await cleanupPromise;
    }

    if (isMeasuring) {
        console.log('Measurement is already running.');
        return;
    }

    if (sdk) {
        console.log('Previous sdk instance has not been cleaned up');
        return;
    }

    try {
        sdk = new SmartSpectraSDK({
            apiKey: process.env.SMARTSPECTRA_API_KEY,
            requestedMetrics: [...breathingMetrics]
        });

        // Configure camera
        sdk.useCamera(
            CameraSelection.byId(selectedCamera.id)
        );

        // SDK error listener
        sdk.on('error', (code, message, retryable) => {
            console.error(
                'SmartSpectra error:',
                code,
                message,
                'retryable:',
                retryable
            );
        });

        // Processing status listener
        sdk.on('processingStatus', status => {
            console.log('Processing status:', status);
        });

        // Validation status listener
        let previousValidationCode = null;
        let previousValidationHint = null;

        validationOK = false;

        sdk.on('validationStatus', (code, ts, hint) => {
            validationOK = code === 0;

            if (
                code !== previousValidationCode ||
                hint !== previousValidationHint
            ) {
                console.log('Validation:', code, hint);

                if (!validationOK) {
                    console.log(
                        'Waiting for a valid breathing signal...'
                    );
                }

                previousValidationCode = code;
                previousValidationHint = hint;
            }
        });

        // Breathing measurement listener
        let lastMeasurementTime = 0;
        let lastQualityMessageTime = 0;
        let previousSignalState = null;

        sdk.on('metrics', (buf, ts) => {
            try {
                const metrics = decodeMetrics(buf);

                const measurement =
                    metrics?.breathing?.rate?.[0];

                const rate = measurement?.value;
                const stable = measurement?.stable;
                const confidence = measurement?.confidence;

                const now = Date.now();

                // Determine signal state
                let signalState;

                if (!Number.isFinite(rate)) {
                    signalState = 'missing';
                } else if (!validationOK || stable !== true) {
                    signalState = 'unstable';
                } else {
                    signalState = 'stable';
                }

                // Quality warnings every five seconds
                if (signalState !== 'stable') {
                    if (now - lastQualityMessageTime >= 5000) {
                        if (signalState === 'missing') {
                            console.log(
                                'No breathing signal available. Waiting...'
                            );
                        } else {
                            console.log(
                                'Breathing signal is not stable yet.'
                            );
                        }

                        lastQualityMessageTime = now;
                    }

                    previousSignalState = signalState;
                    return;
                }

                previousSignalState = 'stable';

                // Display stable reading once per second
                if (now - lastMeasurementTime >= 1000) {
                    console.log(
                        'Breathing measurement:',
                        rate.toFixed(2),
                        'breaths/min',
                        '| Stable:',
                        stable,
                        '| Confidence:',
                        confidence?.toFixed(2) ?? 'N/A'
                    );

                    lastMeasurementTime = now;
                }

            } catch (error) {
                console.error(
                    'Unable to process breathing metrics:',
                    error.message
                );
            }
        });

        sdk.start();
        isMeasuring = true;

        console.log('Measurement started.');

    } catch (error) {
        console.error(
            'Unable to initialise or start SDK:',
            error.message
        );

        try {
            if (sdk) {
                await sdk.destroy();
                sdk = undefined;
                isMeasuring = false;
            }
        } catch (cleanupError) {
            console.error(
                'Unable to clean up SDK:',
                cleanupError.message
            );

            process.exitCode = 1;
        }
    }
}

// Shared SDK cleanup
export async function cleanupSDK() {
    if (cleanupPromise) {
        return cleanupPromise;
    }

    cleanupPromise = (async () => {
        try {
            if (isMeasuring && sdk) {
                await sdk.stopAsync();

                console.log('Measurement stopped.');
                isMeasuring = false;
            }
        } catch (error) {
            console.error(
                'Unable to stop measurement:',
                error.message
            );

            process.exitCode = 1;
        } finally {
            if (sdk) {
                try {
                    await sdk.destroy();

                    sdk = undefined;
                    isMeasuring = false;
                } catch (error) {
                    console.error(
                        'Unable to destroy SDK:',
                        error.message
                    );

                    process.exitCode = 1;
                }
            }
        }
    })();

    try {
        await cleanupPromise;
    } finally {
        cleanupPromise = null;
    }
}
