/**
 * @fileoverview Page Object Model for the Employee List page.
 */
import { Page, Locator } from '@playwright/test';

export class PimPage {
    readonly page: Page;

    // --- Locators cho Search Filters ---
    readonly dropdownInclude: Locator;
    readonly dropdownOptions: Locator;
    
    // --- Locators cho Action Buttons ---
    readonly btnSearch: Locator;
    readonly btnReset: Locator;
    readonly btnAdd: Locator;

    constructor(page: Page) {
        this.page = page;

        this.dropdownInclude = page.locator('.oxd-input-group')
            .filter({ hasText: 'Include' })
            .locator('.oxd-select-wrapper');

        this.dropdownOptions = page.locator('role=listbox');

        this.btnSearch = page.getByRole('button', { name: 'Search' });
        this.btnReset = page.getByRole('button', { name: 'Reset' });
        this.btnAdd = page.getByRole('button', { name: 'Add' });
    }

    /**
     * Selects an option from the Include dropdown.
     * @param optionText - The text of the option to select (e.g., 'Current Employees Only', 'Past Employees Only', 'Current and Past Employees')
     */
    async selectIncludeOption(optionText: string) {
        await this.dropdownInclude.click();
        await this.page.getByRole('option', { name: optionText }).click();
    }
}