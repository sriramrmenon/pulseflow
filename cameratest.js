import {
  SmartSpectraSDK,
  breathingMetrics,
  CameraSelection,
  decodeMetrics
} from '@smartspectra/node-sdk';

// 1. Discover available cameras
const cameras = await SmartSpectraSDK.availableCameras();

// 2. Validate API key
if (!process.env.SMARTSPECTRA_API_KEY) {
  throw new Error('SmartSpectra API key is missing');
}

// 3. Initialise SmartSpectra SDK
const sdk = new SmartSpectraSDK({
  apiKey: process.env.SMARTSPECTRA_API_KEY,
  requestedMetrics: [...breathingMetrics],
});

// 4. Select default camera
sdk.useCamera(CameraSelection.default);

console.log(cameras);

// 5. Error listener
sdk.on('error', (code, message, retryable) => {
  console.error('SmartSpectra error:', code, message, 'retryable:', retryable);
});

// 6. Processing status listener
sdk.on('processingStatus', (status) => {
  console.log('Processing status:', status);
});

// 7. Validation status listener
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
let lastMeasurementTime = 0;
// 8. Metrics listener
sdk.on('metrics', (buf, ts) => {
  const metrics = decodeMetrics(buf);

  const rate = metrics?.breathing?.rate?.[0]?.value;

  if (typeof rate !== 'number' || !Number.isFinite(rate)) {
    return;
  }

  const now = Date.now();

  if (now - lastMeasurementTime >= 1000) {
    console.log('Breathing measurement:', rate.toFixed(2), 'breaths/min');

    lastMeasurementTime = now;
  }
});

// 9. Safe shutdown handler
// On shutdown:
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

// 10. Start measurement

sdk.start()
// To be implemented after shutdown handling
