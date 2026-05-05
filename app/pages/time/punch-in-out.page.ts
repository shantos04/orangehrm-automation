/**
 * @fileoverview Page Object Model for the Punch In/Out page in the Time/Attendance module.
 * 
 * This file encapsulates all the UI elements (locators) and user actions (methods) 
 * specific to the "Punch In" and "Punch Out" forms. It inherits from BasePage to 
 * utilize common elements like the global loading spinner.
 */

import { Page, Locator } from '@playwright/test';
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
    // --- Action Methods ---
    // ========================================================================

    /**
     * Retrieves the exact "Punched in time" text displayed on the UI.
     * Useful for test assertions to compare punch-in and punch-out logic.
     * 
     * @returns {Promise<string>} The trimmed string of the punched-in time.
     */
    async getPunchedInTimeText(): Promise<string> {
        return (await this.lblPunchedInTime.innerText()).trim();
    }
    
    /**
     * Enters the punch-out/in date into the date input field.
     * 
     * @param {string} date - The date to enter (expected format matches placeholder).
     */
    async enterDate(date: string) {
        await this.txtDate.fill(date);
    }

    /**
     * Enters the punch-out/in time into the time input field.
     * 
     * @param {string} time - The time to enter (expected format: hh:mm AM/PM).
     */ 
    async enterTime(time: string) {
        await this.txtTime.fill(time);
    }

    /**
     * Enters an optional note for the punch-out/in record.
     * 
     * @param {string} note - The note text to enter.
     */
    async enterNote(note: string) {
        await this.txtNote.fill(note);
    }

    /**
     * Clicks the "In" button to submit the punch-in form.
     */
    async clickInButton() {
        await this.btnIn.click();
    }

    /**
     * Clicks the "Out" button to submit the punch-out form.
     */
    async clickOutButton() {
        await this.btnOut.click();
    }

    /**
     * Fills out and submits the entire Punch Out form in a single streamlined flow,
     * then waits for the global loading spinner to disappear.
     * 
     * @param {string} date - The punch-out date.
     * @param {string} time - The punch-out time.
     * @param {string} [note] - (Optional) The note for the punch-out record.
     */
    async submitPunchOutForm(date: string, time: string, note?: string) {
        await this.enterDate(date);
        await this.enterTime(time);
        
        if (note) {
            await this.enterNote(note);
        }
        
        await this.clickOutButton();
        
        // Uses the inherited method from BasePage to ensure the system processes the request 
        await this.waitForGlobalLoading();
    }
}