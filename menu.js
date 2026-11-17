
import {
    startMeasurement,
    cleanupSDK,
    measurementIsRunning
} from './measurement.js';

export async function runMenu(rl, selectedCamera) {
    let running = true;

    while (running) {
        console.log('\nPulseFlow Measurement Menu');
        console.log('1. Start measurement');
        console.log('2. Stop measurement');
        console.log('3. Exit');

        const answer = await rl.question('Enter your selection: ');

        switch (answer.trim()) {
            case '1':
                await startMeasurement(selectedCamera);
                break;

            case '2':
                if (measurementIsRunning()) {
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
        }
    }
}
