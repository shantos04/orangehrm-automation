/**
 * @fileoverview Page Object Model for the Employee List page.
 */
import { Page, Locator } from '@playwright/test';

export class PimPage {
    readonly page: Page;

    // --- Locators cho Search Filters ---
    readonly dropdownInclude: Locator;
    readonly txtEmployeeName: Locator;

    // --- Web table Locators ---
    readonly tableContainer: Locator;
    readonly tableHeaderRow: Locator;
    readonly tableBody: Locator;
    readonly tableRows: Locator;
    readonly columnHeaders: Locator;
    readonly tableLoadingSpinner: Locator;
    readonly masterCheckbox: Locator;


    // --- Locators cho Action Buttons ---
    readonly btnSearch: Locator;
    readonly btnReset: Locator;
    readonly btnAdd: Locator;
    readonly btnConfirmDelete: Locator;
    readonly btnNextPage: Locator;


    constructor(page: Page) {
        this.page = page;

        this.dropdownInclude = page.locator('.oxd-input-group')
            .filter({ hasText: 'Include' })
            .locator('.oxd-select-wrapper');
        this.txtEmployeeName = page.getByPlaceholder('Type for hints...').first();

        this.tableContainer = page.locator('.orangehrm-container');
        this.tableHeaderRow = page.locator('.oxd-table-header');
        this.tableBody = page.locator('.oxd-table-body');
        this.tableRows = page.locator('.oxd-table-card');
        this.columnHeaders = this.tableHeaderRow.locator('.oxd-table-header-cell');
        this.tableLoadingSpinner = page.locator('.oxd-loading-spinner');
        this.masterCheckbox = this.tableHeaderRow.locator('.oxd-checkbox-wrapper');

        this.btnSearch = page.getByRole('button', { name: 'Search' });
        this.btnReset = page.getByRole('button', { name: 'Reset' });
        this.btnAdd = page.getByRole('button', { name: 'Add' });
        this.btnConfirmDelete = page.locator('.oxd-table-cell-actions').locator('//button[i[contains(@class, "bi-trash")]]');
        this.btnNextPage = page.locator('.oxd-pagination-page-item--previous-next').filter({ has: page.locator('i.bi-chevron-right') });
    }

    /**
     * Selects an option from the Include dropdown.
     * @param optionText - The text of the option to select (e.g., 'Current Employees Only', 'Past Employees Only', 'Current and Past Employees')
     */
    async selectIncludeOption(optionText: string) {
        await this.dropdownInclude.click();
        await this.page.getByRole('option', { name: optionText }).click();
    }

    async sortColumnBy(columnName: string, sortDirection: 'Ascending' | 'Descending') {

        const escapedColumnName = columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exactWordRegex = new RegExp('^\\s*' + escapedColumnName);
        const columnHeader = this.columnHeaders.filter({ hasText: exactWordRegex });

        const sortIcon = columnHeader.locator('.oxd-table-header-sort');
        await sortIcon.click();

        // Tách ra thành 1 biến rõ ràng để dễ bảo trì sau này
        const sortDropdown = columnHeader.locator('.oxd-table-header-sort-dropdown');
        const sortOption = sortDropdown.getByText(sortDirection);

        await sortOption.click();
    }

    async clickResetButton() {
        await this.btnReset.click();
    }
}