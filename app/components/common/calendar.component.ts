/**
 * @fileoverview Reusable component for the OrangeHRM Date Picker / Calendar Widget.
 * Handles dynamic Vue.js DOM rendering by scoping locators to specific date wrappers.
 */

import { Page, Locator, expect } from '@playwright/test';

export class CalendarComponent {
    readonly page: Page;

    // --- Core Containers ---
    readonly dateWrapper: Locator;
    readonly dateInput: Locator;
    readonly calendarIcon: Locator;
    readonly calendarContainer: Locator;
    
    // --- Header Controls ---
    readonly monthDropdown: Locator;
    readonly yearDropdown: Locator;
    readonly btnNextMonth: Locator;
    readonly btnPrevMonth: Locator;
    readonly lblCurrentMonth: Locator;
    readonly lblCurrentYear: Locator;
    
    // --- Footer Action Buttons ---
    readonly btnToday: Locator;
    readonly btnClear: Locator;
    readonly btnClose: Locator;
    
    /**
     * Initializes the CalendarComponent object.
     * @param {Page} page - The Playwright Page instance.
     * @param {number} [index=0] - The zero-based index of the date picker if multiple exist on the page.
     */
    constructor(page: Page, index: number = 0) {
        this.page = page;

        // Locate the main parent wrapper 
        this.dateWrapper = page.locator('.oxd-date-wrapper').nth(index);

        // Locate the actual input field for reading its value
        this.dateInput = this.dateWrapper.locator('input');
        
        // Locate the icon inside this specific wrapper
        this.calendarIcon = this.dateWrapper.locator('.oxd-date-input-icon');

        // Locate the dynamic calendar container based on the exact class from the screenshot
        this.calendarContainer = this.dateWrapper.locator('.oxd-date-input-calendar');

        /// --- Header controls scoped to the calendar container ---
        this.monthDropdown = this.calendarContainer.locator('.oxd-calendar-selector-month');
        this.yearDropdown = this.calendarContainer.locator('.oxd-calendar-selector-year');

        // Locate the current month label
        this.lblCurrentMonth = this.monthDropdown.locator('.oxd-text--p');
        this.lblCurrentYear = this.yearDropdown.locator('.oxd-text--p')
        
        // Using Playwright's ':has()' to directly target the button containing the specific icon.
        this.btnPrevMonth = this.calendarContainer.locator('.oxd-calendar-header button:has(i.bi-chevron-left)');
        this.btnNextMonth = this.calendarContainer.locator('.oxd-calendar-header button:has(i.bi-chevron-right)');

        // --- Footer action buttons scoped to the calendar container ---
        this.btnToday = this.calendarContainer.getByText('Today', { exact: true });
        this.btnClear = this.calendarContainer.getByText('Clear', { exact: true });
        this.btnClose = this.calendarContainer.getByText('Close', { exact: true }); // Newly added from your screenshot
    }


    // ========================================================================
    // --- Action Keywords (Step Action) ---
    // ========================================================================

    /**
     * KEYWORD STEP ACTION: Clicks the calendar icon to trigger the Vue.js DOM rendering of the widget.
     */
    async openCalendar() {
        await this.calendarIcon.click();
        
        // Explicitly wait for the newly injected DOM node to become visible
        await this.calendarContainer.waitFor({ state: 'visible' });
    }

    /**
     * KEYWORD STEP ACTION: Closes the calendar widget using the 'Close' button.
     */
    async closeCalendar() {
        await this.btnClose.click();
        await this.calendarContainer.waitFor({state: 'hidden'});
    }

    /**
     * KEYWORD STEP ACTION: Clicks the 'Clear' button to erase the selected date.
     */
    async clearDate() {
        await this.btnClear.click();
    }

    /**
     * KEYWORD STEP ACTION: Clicks the 'Today' button to quickly select the current date.
     */
    async selectToday() {
        await this.btnToday.click();
    }

    /**
     * Selects a specific year from the calendar's year dropdown.
     * @param {string} year - The target year (e.g., '2026').
     */
    async selectYear(year: string) {
        await this.yearDropdown.click();
        
        // FIX: OrangeHRM uses custom <ul>/<li> elements for dropdowns instead of native <select> tags 
        // and lacks ARIA 'role="option"' attributes. We scope to the dropdown container and find by text.
        const dropdownList = this.calendarContainer.locator('.oxd-calendar-dropdown--option');
        await dropdownList.getByText(year, { exact: true }).click();
    }

    /**
     * Selects a specific month from the calendar's month dropdown.
     * @param {string} month - The full name of the month (e.g., 'May').
     */
    async selectMonth(month: string) {
        await this.monthDropdown.click();
        
        // FIX: Applied the same stable locator strategy for the month selection.
        const dropdownList = this.calendarContainer.locator('.oxd-calendar-dropdown--option');
        await dropdownList.getByText(month, { exact: true }).click();
    }

    /**
     * Selects a specific day from the calendar grid.
     * @param {string} day - The exact day number (e.g., '5' or '15').
     */
    async selectDay(day: string) {
        // Use exact text matching to avoid accidentally clicking faded dates belonging to adjacent months
        const dayCell = this.calendarContainer.locator('.oxd-calendar-date').filter({ hasText: new RegExp(`^${day}$`) });
        await dayCell.click();
    }

    /**
     * Opens the calendar widget and selects a full date (Year, Month, Day).
     * @param {string} year - The target year.
     * @param {string} month - The target month.
     * @param {string} day - The target day.
     */
    async selectFullDate(year: string, month: string, day: string) {
        await this.openCalendar();
        await this.selectYear(year);
        await this.selectMonth(month);
        await this.selectDay(day);
    }

    // ========================================================================
    // --- Verification Keywords (Step Verify) ---
    // ========================================================================

    /**
     * KEYWORD STEP VERIFY: Asserts whether the calendar widget popup is visible on the screen.
     */
    async verifyCalendarIsVisible() {
        await expect(this.calendarContainer).toBeVisible();
    }

    /**
     * KEYWORD STEP VERIFY: Asserts whether the calendar widget popup is hidden.
     */
    async verifyCalendarIsHidden() {
        await expect(this.calendarContainer).toBeHidden();
    }

    /**
     * KEYWORD STEP VERIFY: Validates that the input field displays the correct date string.
     * @param {string} expectedDateString - The formatted date expected in the input field (e.g., '2026-05-15').
     */
    async verifySelectedDateValue(expectedDateString: string) {
        await expect(this.dateInput).toHaveValue(expectedDateString);
    }

    /**
     * KEYWORD STEP VERIFY: Validates that the input field is completely empty.
     */
    async verifyDateIsEmpty() {
        await expect(this.dateInput).toHaveValue('');
    }
}