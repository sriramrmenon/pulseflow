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
sdk.on('validationStatus', (code, ts, hint) => {
  console.log('Validation:', code, hint, 'at', ts, 'µs');
});

// 8. Metrics listener
sdk.on('metrics', (buf, ts) => {
  console.log('Metrics received at', ts, 'µs');
  const metrics =  decodeMetrics(buf);
  if (metrics.breathing.rate.length > 0){
  console.log('Breathing measurement:', metrics.breathing.rate[0].value);
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
    process.exit(process.exitCode ?? 0);
  }
});

// 10. Start measurement

sdk.start()
// To be implemented after shutdown handling
