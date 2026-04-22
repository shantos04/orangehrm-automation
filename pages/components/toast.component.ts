/**
 * @fileoverview Shared UI component for handling dynamic toast notifications.
 * This component is designed to be reused across different modules (PIM, Admin, Leave, etc.)
 * to capture temporary pop-up messages like Success, Error, or Info.
 */

import {Page, Locator} from '@playwright/test';

/**
 * Represents the Toast notification popup in the OrangeHRM application.
 */
export class ToastComponent {

    /** The Playwright Page instance representing the current browser tab. */
    readonly page: Page;

    /** Locator for the generic toast container */
    readonly toastMessage: Locator;

    /**
     * Initializes the ToastComponent and defines its locators.
     * * @param {Page} page - The Playwright page object.
     */
    constructor(page: Page) {
        this.page = page;
        this.toastMessage = page.locator('.oxd-toast');
    }
}