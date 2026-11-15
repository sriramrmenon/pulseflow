
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 30000,
    expect: {
        timeout: 10000
    },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [
        ['list'],
        ['html', {
            open: 'never',
            outputFolder: 'playwright-report'
        }]
    ],
    use: {
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    }
});
