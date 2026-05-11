/**
 * @fileoverview Page Object Model for the Punch In/Out page in the Time/Attendance module.
 * 
 * This file encapsulates all the UI elements (locators) and user actions (methods) 
 * specific to the "Punch In" and "Punch Out" forms. It inherits from BasePage to 
 * utilize common elements like the global loading spinner.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class PunchInOutPage extends BasePage {
    // --- Locators ---

    // Label displaying the exact date and time the user punched in
    readonly mainTitle: Locator;
    readonly lblPunchedInTime: Locator;

    // Input fields for the Punch In/Out form
    readonly txtDate: Locator;
    readonly txtTime: Locator;
    readonly txtNote: Locator;

    // Action buttons to submit the form
    readonly btnIn: Locator;
    readonly btnOut: Locator;

    // Validation error messages for mandatory or improperly formatted fields
    readonly errorMessageDate: Locator;
    readonly errorMessageTime: Locator;

    /**
     * Initializes the PunchInOutPage object, inherits from BasePage, and defines locator strategies.
     * @param {Page} page - The Playwright Page instance.
     */
    constructor(page: Page) {
        // Calls the BasePage constructor to initialize the page object and globalLoadingSpinner
        super(page);

        this.mainTitle = page.locator('.orangehrm-main-title');

        // Find the input group containing the specific text, then locate the paragraph element inside it.
        this.lblPunchedInTime = page.locator('.oxd-input-group').filter({ hasText: 'Punched in time' }).locator('p.oxd-text--subtitle-2');
        
        // Locate input fields utilizing their visible placeholders.
        this.txtDate = page.getByPlaceholder('yyyy-dd-mm');
        this.txtTime = page.getByPlaceholder('hh:mm');
        this.txtNote = page.getByPlaceholder('Type here');

        // Locate the submit button using its accessibility role and accessible name.
        this.btnIn = page.getByRole('button', { name: 'In' });
        this.btnOut = page.getByRole('button', { name: 'Out' });

        // Find the parent group by label text, then target the specific OrangeHRM error message class.
        this.errorMessageDate = page.locator('.oxd-input-group').filter({ hasText: 'Date' }).locator('.oxd-input-field-error-message');
        this.errorMessageTime = page.locator('.oxd-input-group').filter({ hasText: 'Time' }).locator('.oxd-input-field-error-message');
    }

    // ========================================================================
    // --- Action Keywords (Step Action) ---
    // ========================================================================

    /**
     * KEYWORD STEP ACTION: Fills out and optionally submits the Punch In form.
     * * @param {Object} punchData - Object containing the Punch In details.
     * @param {string} punchData.date - The punch-in date (yyyy-dd-mm).
     * @param {string} punchData.time - The punch-in time (hh:mm AM/PM).
     * @param {string} [punchData.note] - Optional note for the punch-in record.
     * @param {boolean} [submitPunch=true] - Determines whether to click the 'In' button. Defaults to true.
     */
    async punchIn(punchData: {
        date: string,
        time: string,
        note?: string
        },
        submitPunch: boolean = true
    ) {
        await this.txtDate.fill(punchData.date);
        await this.txtTime.fill(punchData.time);

        if (punchData.note) {
            await this.txtNote.fill(punchData.note);
        }

        if (submitPunch) {
            await this.btnIn.click();
            await this.waitForGlobalLoading();
        }
    }

    /**
     * KEYWORD STEP ACTION: Fills out and optionally submits the Punch Out form.
     * * @param {Object} punchData - Object containing the Punch Out details.
     * @param {string} punchData.date - The punch-out date (yyyy-dd-mm).
     * @param {string} punchData.time - The punch-out time (hh:mm AM/PM).
     * @param {string} [punchData.note] - Optional note for the punch-out record.
     * @param {boolean} [submitPunch=true] - Determines whether to click the 'Out' button. Defaults to true.
     */
    async punchOut(punchData: {
        date: string,
        time: string,
        note?: string,
        },
        submitPunch: boolean = true
    ) {
        await this.txtDate.fill(punchData.date);
        await this.txtTime.fill(punchData.time);
        
        if (punchData.note) {
            await this.txtNote.fill(punchData.note);
        }

        if (submitPunch) {
            await this.btnOut.click();
            await this.waitForGlobalLoading();
        }
    }

    /**
     * Retrieves the exact "Punched in time" text displayed on the UI.
     * Useful for test assertions to compare punch-in and punch-out logic.
     * 
     * @returns {Promise<string>} The trimmed string of the punched-in time.
     */
    async getPunchedInTimeText(): Promise<string> {
        return (await this.lblPunchedInTime.innerText()).trim();
    }

    // ========================================================================
    // --- Verification Keywords (Step Verify) ---
    // ========================================================================

    /**
     * KEYWORD STEP VERIFY: Validates the presence of error messages for the Date and/or Time fields.
     * Useful for testing empty field submissions or invalid formats.
     * * @param expectedErrors - Object indicating the expected error text.
     * @param {string} [expectedErrors.date] - Expected error text under the Date field.
     * @param {string} [expectedErrors.time] - Expected error text under the Time field.
     */
    async verifyFormValidationErrors(expectedErrors: {
        date?: string,
        time?: string
    }) {
        if (expectedErrors.date) {
            await expect(this.errorMessageDate).toBeVisible();
            await expect(this.errorMessageDate).toHaveText(expectedErrors.date);
        }

        if (expectedErrors.time) {
            await expect(this.errorMessageTime).toBeVisible();
            await expect(this.errorMessageTime).toHaveText(expectedErrors.time);
        }
    }

    /**
     * KEYWORD STEP VERIFY: Validates that the form successfully loaded the correct Title.
     * * @param {string} expectedTitle - The expected main title (e.g., 'Punch In' or 'Punch Out').
     */
    async verifyMainTitle(expectedTitle: string) {
        // Verify the page's main title text matches the expected title
        await expect(this.mainTitle).toBeVisible();
        await expect(this.mainTitle).toHaveText(expectedTitle);
    }
}