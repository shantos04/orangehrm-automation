import { Page, Locator } from '@playwright/test';

export class BasePage {
    readonly page: Page;
    readonly globalLoadingSpinner: Locator;

    constructor(page: Page) {
        this.page = page;
        this.globalLoadingSpinner = page.locator('.oxd-form-loader'); // Hoặc class tương ứng
    }

    async waitForGlobalLoading() {
        await this.globalLoadingSpinner.waitFor({ state: 'hidden' });
    }
}