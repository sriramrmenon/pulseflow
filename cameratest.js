

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

  // 7. Select camera using array indexing
  selectedCamera = cameras[cameraNumber - 1];

  console.log('Selected camera:', selectedCamera.name);

  // 8. Request user consent
  const consent = await rl.question(
    `Allow PulseFlow to use "${selectedCamera.name}" for breathing measurement? (yes/no): `
  );

  consentGranted = consent.trim().toLowerCase() === 'yes';

  if (!consentGranted) {
    console.log('Camera access not authorised. Exiting.');
  }
} finally {
  rl.close();
}

// 9. Only initialise and start if consent was granted
if (consentGranted) {

  const sdk = new SmartSpectraSDK({
    apiKey: process.env.SMARTSPECTRA_API_KEY,
    requestedMetrics: [...breathingMetrics]
  });

  // 10. Configure selected camera
  sdk.useCamera(CameraSelection.byId(selectedCamera.id));

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

  // 15. Safe shutdown handler
  let shuttingDown = false;

  process.on('SIGINT', async () => {
    if (shuttingDown) return;

    shuttingDown = true;

    try {
      await sdk.stopAsync();
    } catch (error) {
      console.error('Error stopping SDK:', error.message);
      process.exitCode = 1;
    } finally {
      try {
        await sdk.destroy();
      } catch (error) {
        console.error('Error destroying SDK:', error.message);
        process.exitCode = 1;
      }
    }
  });

  // 16. Start camera and measurement
  console.log('Starting SmartSpectra measurement...');
  console.log('Press Ctrl+C to stop');

  try {
  sdk.start();
} catch (error) {
  console.error('Unable to start camera:', error.message);

  try {
    await sdk.destroy();
  } catch (cleanupError) {
    console.error('SDK cleanup failed:', cleanupError.message);
  }

  process.exitCode = 1;
}
}
