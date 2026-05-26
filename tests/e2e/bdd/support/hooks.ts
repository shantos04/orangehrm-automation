/**
 * @fileoverview Cucumber Hooks Configuration
 * Manages the global setup, teardown, and per-scenario browser context 
 * for Playwright within the Cucumber BDD framework.
 */

import { BeforeAll, AfterAll, Before, After, setDefaultTimeout, Status } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

setDefaultTimeout(60 * 1000);

let browser: Browser;
export let context: BrowserContext;
export let page: Page;

/**
 * Executes once before all scenarios.
 * Launches the browser instance.
 */
BeforeAll(async function () {
    console.log('Launching browser...');
    browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized']
    });
});

/**
 * Executes before each individual scenario.
 * Creates a fresh, isolated Browser Context and Page to ensure test independence.
 */
Before(async function () {
    context = await browser.newContext({
        baseURL: 'https://opensource-demo.orangehrmlive.com',
        viewport: null
    });

    page = await context.newPage();
});

/**
 * Executes after each individual scenario.
 * Handles screenshot capture on failure and cleans up the Page/Context.
 */
After(async function (scenario) {
    if (scenario.result?.status === Status.FAILED) {
        console.log(`Scenario Failed: ${scenario.pickle.name}. Taking screenshot...`);

        const screenshot = await page.screenshot({
            fullPage: true
        });

        this.attach(screenshot, 'image/png');
    }

    // Dọn dẹp môi trường: Đóng trang và context sau khi test xong
    await page.close();
    await context.close();
});

/**
 * Executes once after all scenarios have finished.
 * Closes the browser instance to free up system resources.
 */
AfterAll(async function () {
    console.log('Closing browser...');
    if (browser) {
        await browser.close();
    }
});