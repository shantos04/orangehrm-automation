/**
 * @fileoverview Page Object Model for the Employee List page.
 */
import { Page, Locator } from '@playwright/test';

export class PimPage {
    readonly page: Page;

    // --- Locators cho Search Filters ---
    readonly dropdownInclude: Locator;

    // --- Web table Locators ---
    readonly tableContainer: Locator;
    readonly tableHeaderRow: Locator;
    readonly tableBody: Locator;
    readonly tableRow: Locator;
    readonly columnHeaders: Locator;
    readonly tableLoadingSpinner: Locator;


    // --- Locators cho Action Buttons ---
    readonly btnSearch: Locator;
    readonly btnReset: Locator;
    readonly btnAdd: Locator;
    readonly btnConfirmDelete: Locator;


    constructor(page: Page) {
        this.page = page;

        this.dropdownInclude = page.locator('.oxd-input-group')
            .filter({ hasText: 'Include' })
            .locator('.oxd-select-wrapper');

        this.tableContainer = page.locator('.orangehrm-container');
        this.tableHeaderRow = page.locator('.oxd-table-header');
        this.tableBody = page.locator('.oxd-table-body');
        this.tableRow = page.locator('.oxd-table-card');
        this.columnHeaders = this.tableHeaderRow.locator('.oxd-table-header-cell');
        this.tableLoadingSpinner = page.locator('.oxd-loading-spinner');

        this.btnSearch = page.getByRole('button', { name: 'Search' });
        this.btnReset = page.getByRole('button', { name: 'Reset' });
        this.btnAdd = page.getByRole('button', { name: 'Add' });
        this.btnConfirmDelete = page.locator('.oxd-table-cell-actions').locator('//button[i[contains(@class, "bi-trash")]]');
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