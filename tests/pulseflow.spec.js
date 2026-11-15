
import { test, expect, _electron as electron } from '@playwright/test';

let electronApp;
let window;

// Send simulated SDK-facing events through Electron IPC.
// This exercises the real preload and renderer UI.
async function sendEvent(channel, value) {
    await electronApp.evaluate(
        ({ BrowserWindow }, data) => {
            const mainWindow = BrowserWindow.getAllWindows()[0];

            if (!mainWindow) {
                throw new Error('PulseFlow window not found');
            }

            mainWindow.webContents.send(
                data.channel,
                data.value
            );
        },
        { channel, value }
    );
}

// Start the real Electron application for each test
test.beforeEach(async () => {
    electronApp = await electron.launch({
        args: ['.'],
        cwd: process.cwd(),
        env: {
            ...process.env
        }
    });

    window = await electronApp.firstWindow();

    await window.waitForLoadState('domcontentloaded');

    await expect(
        window.locator('#breathing-rate')
    ).toBeVisible();
});

// Close the application and release its resources
test.afterEach(async () => {
    if (electronApp) {
        await electronApp.close();
        electronApp = null;
    }
});

// SMOKE 01
test('Electron window loads the main controls', async () => {
    await expect(
        window.locator('#camera-select')
    ).toBeVisible();

    await expect(
        window.locator('#start-button')
    ).toBeVisible();

    await expect(
        window.locator('#stop-button')
    ).toBeVisible();

    await expect(
        window.locator('#session-status')
    ).toBeVisible();

    await expect(
        window.locator('#signal-quality')
    ).toBeVisible();
});

// SMOKE 02
test('Initial state shows no breathing measurement', async () => {
    await expect(
        window.locator('#breathing-rate')
    ).toHaveText('--');

    await expect(
        window.locator('#stop-button')
    ).toBeDisabled();

    await expect(
        window.locator('.ripple-layer')
    ).not.toHaveClass(/active/);
});

// REGRESSION 01
test('Waveform is flat when no measurement exists', async () => {
    await expect(
        window.locator('.waveform-panel')
    ).toBeVisible();

    await expect(
        window.locator('.waveform-path')
    ).toHaveAttribute(
        'd',
        'M 0 25 L 180 25'
    );
});

// REGRESSION 02
test('Three ripple elements exist around the centre dot', async () => {
    await expect(
        window.locator('.circle-centre')
    ).toBeVisible();

    await expect(
        window.locator('.breathing-ripple')
    ).toHaveCount(3);
});

// REGRESSION 03
test('Measurement acquisition indicator appears while waiting', async () => {
    await sendEvent('session-status', 'measuring');

    await expect(
        window.locator('.acquisition-indicator')
    ).toBeVisible();

    await expect(
        window.locator('.acquisition-text')
    ).toContainText('Detecting your breathing');
});

// REGRESSION 04
test('A valid reading activates the visualisations', async () => {
    await sendEvent('session-status', 'measuring');

    await sendEvent('breathing-rate', 18.5);
    await sendEvent('signal-quality', 'Stable');

    await expect(
        window.locator('#breathing-rate')
    ).toHaveText('18.50');

    await expect(
        window.locator('#signal-quality')
    ).toHaveText('Stable');

    await expect(
        window.locator('.acquisition-indicator')
    ).toBeHidden();

    await expect(
        window.locator('.ripple-layer')
    ).toHaveClass(/active/);

    await expect(
        window.locator('.waveform-panel')
    ).toHaveClass(/active/);
});

// REGRESSION 05
test('Stale measurement remains visible but animations stop', async () => {
    await sendEvent('session-status', 'measuring');

    await sendEvent('breathing-rate', 18.5);
    await sendEvent('signal-quality', 'Stable');

    await expect(
        window.locator('.ripple-layer')
    ).toHaveClass(/active/);

    await sendEvent('signal-quality', 'Last valid reading');

    await expect(
        window.locator('#breathing-rate')
    ).toHaveText('18.50');

    await expect(
        window.locator('#measurement-message')
    ).toContainText('waiting for fresh data');

    await expect(
        window.locator('.ripple-layer')
    ).not.toHaveClass(/active/);

    await expect(
        window.locator('.waveform-path')
    ).toHaveAttribute(
        'd',
        'M 0 25 L 180 25'
    );
});

// REGRESSION 06
test('Camera positioning guidance appears and disappears', async () => {
    await sendEvent('session-status', 'measuring');

    await sendEvent(
        'validation-status',
        'Move further away from the camera.'
    );

    await expect(
        window.locator('.guidance-popup')
    ).toBeVisible();

    await expect(
        window.locator('.guidance-popup')
    ).toContainText('Move further away');

    await sendEvent(
        'validation-status',
        'Hold still and record.'
    );

    await expect(
        window.locator('.guidance-popup')
    ).toBeHidden();
});

// REGRESSION 07
test('Stop retains the last valid breathing rate', async () => {
    await sendEvent('session-status', 'measuring');

    await sendEvent('breathing-rate', 20.25);
    await sendEvent('signal-quality', 'Stable');

    await sendEvent('session-status', 'stopping');

    await sendEvent('breathing-rate', 20.25);
    await sendEvent('signal-quality', 'Last valid reading');
    await sendEvent('session-status', 'idle');

    await expect(
        window.locator('#breathing-rate')
    ).toHaveText('20.25');

    await expect(
        window.locator('#measurement-message')
    ).toHaveText('Last valid breathing rate');

    await expect(
        window.locator('.ripple-layer')
    ).not.toHaveClass(/active/);

    await expect(
        window.locator('.acquisition-indicator')
    ).toBeHidden();
});

// NEGATIVE 01
test('Unverified readings do not activate live animations', async () => {
    await sendEvent('session-status', 'measuring');

    await sendEvent('breathing-rate', 30.5);
    await sendEvent('signal-quality', 'Unstable');

    await expect(
        window.locator('.ripple-layer')
    ).not.toHaveClass(/active/);

    await expect(
        window.locator('.waveform-panel')
    ).not.toHaveClass(/active/);
});
