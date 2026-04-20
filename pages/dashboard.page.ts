/**
 * @fileoverview Page Object Model for the OrangeHRM Dashboard Page.
 * This class encapsulates locators and actions available after a successful login.
 */

import {Page, Locator} from '@playwright/test';

export class DashboardPage {
    /** The Playwright Page instance representing the current browser tab. */
    readonly page: Page;

    /** Locator for the main dashboard header/heading. */
    readonly labelHeader: Locator;

    /**
     * Initializes the locators for the Dashboard Page.
     * @param {Page} page - The Playwright Page instance.
     */
    constructor(page: Page) {
        this.page = page;

        // Locates the 'Dashboard' heading using its role and accessible name
        this.labelHeader = page.getByRole('heading', {name: 'Dashboard'});
    }
}