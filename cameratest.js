
import { SmartSpectraSDK } from '@smartspectra/node-sdk';
import { createInterface } from 'node:readline/promises';
import { runMenu } from './menu.js';
import { cleanupSDK } from './measurement.js';

// Validate API key
if (!process.env.SMARTSPECTRA_API_KEY) {
    throw new Error('SmartSpectra API key is missing');
}

// Discover cameras
const cameras = await SmartSpectraSDK.availableCameras();

if (cameras.length === 0) {
    throw new Error('No cameras available');
}

console.log('Available cameras:');

cameras.forEach((camera, index) => {
    console.log(`${index + 1}. ${camera.name}`);
});

// Terminal input
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

let shuttingDown = false;

// Ctrl+C handler
process.on('SIGINT', async () => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log('\nCtrl+C detected. Shutting down PulseFlow...');

    try {
        await cleanupSDK();
    } finally {
        rl.close();
    }
});

try {
    // Select camera
    const answer = await rl.question('Enter camera number: ');
    const cameraNumber = Number(answer.trim());

    if (
        !Number.isInteger(cameraNumber) ||
        cameraNumber < 1 ||
        cameraNumber > cameras.length
    ) {
        throw new Error('Invalid camera selection');
    }

    const selectedCamera = cameras[cameraNumber - 1];

    console.log('Selected camera:', selectedCamera.name);

    // Request camera consent
    const consent = await rl.question(
        `Allow PulseFlow to use "${selectedCamera.name}" for breathing measurement? (yes/no): `
    );

    const consentGranted =
        consent.trim().toLowerCase() === 'yes';

    if (!consentGranted) {
        console.log('Camera access not authorised. Exiting.');
    } else {
        await runMenu(rl, selectedCamera);
    }

} catch (error) {
    if (error.message === 'Aborted with Ctrl+C') {
        if (!shuttingDown) {
            shuttingDown = true;

            console.log(
                '\nCtrl+C detected. Shutting down PulseFlow...'
            );

            await cleanupSDK();
        }
    } else if (!shuttingDown) {
        console.error('PulseFlow error:', error.message);
        process.exitCode = 1;
    }
} finally {
    rl.close();
}
