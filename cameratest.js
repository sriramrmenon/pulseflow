
import {
  SmartSpectraSDK,
  breathingMetrics,
  CameraSelection,
  decodeMetrics
} from '@smartspectra/node-sdk';

import { createInterface } from 'node:readline/promises';

// 1. Validate API key
if (!process.env.SMARTSPECTRA_API_KEY) {
  throw new Error('SmartSpectra API key is missing');
}

// 2. Discover available cameras
const cameras = await SmartSpectraSDK.availableCameras();

if (cameras.length === 0) {
  throw new Error('No cameras available');
}

// 3. Display available cameras
console.log('Available cameras:');

cameras.forEach((camera, index) => {
  console.log(`${index + 1}. ${camera.name}`);
});

// 4. Create terminal input interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

let selectedCamera;
let consentGranted = false;
let sdk;
let running = true;
let isMeasuring = false;
let shuttingDown = false;

// Shared cleanup function
let cleanupPromise = null;

async function cleanupSDK() {
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
      console.error('Unable to stop measurement:', error.message);
      process.exitCode = 1;
    } finally {
      if (sdk) {
        try {
          await sdk.destroy();
          sdk = undefined;
          isMeasuring = false;
        } catch (error) {
          console.error('Unable to destroy SDK:', error.message);
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

// Ctrl+C handler
process.on('SIGINT', async () => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  running = false;

  console.log('\nCtrl+C detected. Shutting down PulseFlow...');

  try {
    await cleanupSDK();
  } finally {
    rl.close();
  }
});

try {
  // 5. Ask user to select a camera
  const answer = await rl.question('Enter camera number: ');
  const cameraNumber = Number(answer.trim());

  // 6. Validate camera number
  if (
    !Number.isInteger(cameraNumber) ||
    cameraNumber < 1 ||
    cameraNumber > cameras.length
  ) {
    throw new Error('Invalid camera selection');
  }

  // 7. Select camera
  selectedCamera = cameras[cameraNumber - 1];
  console.log('Selected camera:', selectedCamera.name);

  // 8. Request user consent
  const consent = await rl.question(
    `Allow PulseFlow to use "${selectedCamera.name}" for breathing measurement? (yes/no): `
  );

  consentGranted = consent.trim().toLowerCase() === 'yes';

  if (!consentGranted) {
    console.log('Camera access not authorised. Exiting.');
    running = false;
  }

  while (running) {
    console.log('\nPulseFlow Measurement Menu');
    console.log('1. Start measurement');
    console.log('2. Stop measurement');
    console.log('3. Exit');

    const answer = await rl.question('Enter your selection: ');

    switch (answer.trim()) {
      case '1':
        console.log('Starting measurement...');
        console.log('Starting SmartSpectra measurement...');
        console.log('Select option 2 to stop the measurement.');

        if (isMeasuring) {
          console.log('Measurement is already running.');
        } else {
          if (consentGranted && !sdk) {
            try {
              sdk = new SmartSpectraSDK({
                apiKey: process.env.SMARTSPECTRA_API_KEY,
                requestedMetrics: [...breathingMetrics]
              });

              // 10. Configure selected camera
              sdk.useCamera(
                CameraSelection.byId(selectedCamera.id)
              );

              // 11. SDK error listener
              sdk.on('error', (code, message, retryable) => {
                console.error(
                  'SmartSpectra error:',
                  code,
                  message,
                  'retryable:',
                  retryable
                );
              });

              // 12. Processing status listener
              sdk.on('processingStatus', (status) => {
                console.log('Processing status:', status);
              });

              // 13. Validation status listener
              let previousValidationCode = null;
              let previousValidationHint = null;

              sdk.on('validationStatus', (code, ts, hint) => {
                if (
                  code !== previousValidationCode ||
                  hint !== previousValidationHint
                ) {
                  console.log('Validation:', code, hint);
                  previousValidationCode = code;
                  previousValidationHint = hint;
                }
              });

              // 14. Breathing measurement listener
              let lastMeasurementTime = 0;

              sdk.on('metrics', (buf, ts) => {
                const metrics = decodeMetrics(buf);
                const rate = metrics?.breathing?.rate?.[0]?.value;

                if (!Number.isFinite(rate)) {
                  return;
                }

                const now = Date.now();

                if (now - lastMeasurementTime >= 1000) {
                  console.log(
                    'Breathing measurement:',
                    rate.toFixed(2),
                    'breaths/min'
                  );
                  lastMeasurementTime = now;
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
                }
              } catch (cleanupError) {
                console.error(
                  'Unable to clean up SDK:',
                  cleanupError.message
                );
                process.exitCode = 1;
              }
            }
          } else {
            console.log(
              'Previous sdk instance has not been cleaned up'
            );
          }
        }
        break;

      case '2':
        if (isMeasuring) {
          console.log('Stopping measurement...');
          await cleanupSDK();
        } else {
          console.log(
            'Measurement not started, please slelect the correct option'
          );
        }
        break;

      case '3':
        console.log('Exiting PulseFlow...');
        running = false;

        await cleanupSDK();

        console.log('PulseFlow exit completed.');
        break;

      default:
        console.log('Invalid selection');
    } // End of switch
  } // End of while

} catch (error) {
  if (error.message === 'Aborted with Ctrl+C') {
    if (!shuttingDown) {
      shuttingDown = true;
      running = false;

      console.log('\nCtrl+C detected. Shutting down PulseFlow...');

      await cleanupSDK();
    }
  } else if (!shuttingDown) {

    console.error('PulseFlow error:', error.message);
    process.exitCode = 1;
  }
} finally {
  rl.close();
}
