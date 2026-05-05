/**
 * @fileoverview Page Object Model for the PIM Employee List page.
 * Encapsulates locators and UI interaction methods for employee filtering, sorting, and data extraction.
 * Inherits from BasePage to utilize common elements like global loading spinners.
 */
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

export class PimPage extends BasePage {
    // --- Search Filter Locators ---
    readonly dropdownInclude: Locator;
    readonly txtEmployeeName: Locator;
    readonly txtEmployeeId: Locator;

    // --- Web table Locators ---
    readonly tableContainer: Locator;
    readonly tableHeaderRow: Locator;
    readonly tableBody: Locator;
    readonly tableRows: Locator;
    readonly columnHeaders: Locator;
    readonly masterCheckbox: Locator;

    // --- Action Button Locators ---
    readonly btnSearch: Locator;
    readonly btnReset: Locator;
    readonly btnAdd: Locator;
    readonly btnConfirmDelete: Locator;
    readonly btnNextPage: Locator;

    /**
     * Initializes the PimPage object, inherited properties, and defines specific locators.
     * @param {Page} page - The Playwright Page instance.
     */
    constructor(page: Page) {
        // Calls the parent class constructor to initialize inherited locators and methods
        super(page);

        this.dropdownInclude = page.locator('.oxd-input-group')
            .filter({ hasText: 'Include' })
            .locator('.oxd-select-wrapper');
        this.txtEmployeeName = page.getByPlaceholder('Type for hints...').first();
        this.txtEmployeeId = page.locator('.oxd-input-group').filter({hasText: 'Employee Id'}).locator('input');

        this.tableContainer = page.locator('.orangehrm-container');
        this.tableHeaderRow = page.locator('.oxd-table-header');
        this.tableBody = page.locator('.oxd-table-body');
        this.tableRows = page.locator('.oxd-table-card');
        this.columnHeaders = this.tableHeaderRow.locator('.oxd-table-header-cell');
        this.masterCheckbox = this.tableHeaderRow.locator('.oxd-checkbox-wrapper');

        this.btnSearch = page.getByRole('button', { name: 'Search' });
        this.btnReset = page.getByRole('button', { name: 'Reset' });
        this.btnAdd = page.getByRole('button', { name: 'Add' });
        this.btnConfirmDelete = page.locator('.oxd-table-cell-actions').locator('//button[i[contains(@class, "bi-trash")]]');
        this.btnNextPage = page.locator('.oxd-pagination-page-item--previous-next').filter({ has: page.locator('i.bi-chevron-right') });
    }

    /**
     * Selects an option from the 'Include' dropdown filter.
     * @param {string} optionText - The exact text of the option to select.
     */
    async selectIncludeOption(optionText: string) {
        await this.dropdownInclude.click();
        await this.page.getByRole('option', { name: optionText }).click();
    }

    /**
     * Clicks the sort icon on a specified column header and selects the sorting direction.
     * @param {string} columnName - The exact name of the column header to sort.
     * @param {'Ascending' | 'Descending'} sortDirection - The desired sorting direction.
     */
    async sortColumnBy(columnName: string, sortDirection: 'Ascending' | 'Descending') {
        // Escape special characters to prevent Regex errors and match the exact column header text
        const escapedColumnName = columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exactWordRegex = new RegExp('^\\s*' + escapedColumnName);
        const columnHeader = this.columnHeaders.filter({ hasText: exactWordRegex });

        // Locate and click the sort icon for the matched column
        const sortIcon = columnHeader.locator('.oxd-table-header-sort');
        await sortIcon.click();

        // Isolate the sort dropdown locator into a clear variable for better maintainability
        const sortDropdown = columnHeader.locator('.oxd-table-header-sort-dropdown');
        const sortOption = sortDropdown.getByText(sortDirection);

        await sortOption.click();
    }

    /**
     * Clicks the 'Reset' button to clear all active search filters and waits for the table to refresh.
     */
    async clickResetButton() {
        await this.btnReset.click();
        // Uses the inherited method from BasePage to wait for the global loading spinner to disappear
        await this.waitForGlobalLoading();
    }

    /**
     * Extracts all text values from a specific column in the data table.
     * @param {number} columnIndex - The zero-based index of the target column.
     * @param {boolean} [scrapeAllPages=false] - If true, navigates through all pagination pages.
     * @returns {Promise<string[]>} An array containing the trimmed text of each cell in the specified column.
     */
    async getColumnTextsByIndex(columnIndex: number, scrapeAllPages: boolean = false): Promise<string[]> {
        const columnData: string[] = [];
        let hasNextPage = true;

        while (hasNextPage) {
            // Uses the inherited method to wait for the table data to fully load before scraping
            await this.waitForGlobalLoading();

            const allRows = await this.tableRows.all();

            for (const row of allRows) {
                // Retrieve all cell texts for the current row
                const rowTexts = await row.locator('.oxd-table-cell').allInnerTexts();

                // Extract the text at the specified column index and trim excess whitespace
                if (rowTexts.length > columnIndex) {
                    const cellText = rowTexts[columnIndex].trim();
                    
                    // Only append non-empty strings to the array
                    if (cellText) {
                        columnData.push(cellText);
                    }
                }
            }

            // Pagination Handling Logic
            if (scrapeAllPages) {
                const isNextBtnVisible = await this.btnNextPage.isVisible();

                if (isNextBtnVisible) {
                    await this.btnNextPage.click();
                } else {
                    // No more pages left, break the loop
                    hasNextPage = false;
                }
            } else {
                // If the flag is false, exit the loop after the first page
                hasNextPage = false;
            }
        }

        return columnData;
    }

    /**
     * Retrieves the hidden input element of the master checkbox for state verification.
     * @returns {Locator} The locator for the master checkbox input.
     */
    get masterCheckboxInput(): Locator {
        return this.masterCheckbox.locator('input[type="checkbox"]');
    }

    /**
     * Extracts the Employee ID text from the first row of the currently visible table.
     * @returns {Promise<string>} The ID text of the first employee.
     */
    async getFirstRowIdText(): Promise<string> {
        return await this.tableRows.first().locator('.oxd-table-cell').nth(1).innerText();
    }

    /**
     * Clicks the custom checkbox wrapper of the first row in the data table.
     */
    async checkFirstRowCheckbox(): Promise<void> {
        const firstRow = this.tableRows.first();
        await firstRow.locator('.oxd-checkbox-wrapper').click();
    }

    /**
     * Retrieves the hidden input element of the first row's checkbox for state verification.
     * @returns {Locator} The Locator for the first row's checkbox input.
     */
    getFirstRowCheckboxInput(): Locator {
        return this.tableRows.first().locator('input[type="checkbox"]');
    }

    /**
     * Retrieves all hidden input elements for the checkboxes of every visible row in the table.
     * @returns {Promise<Locator[]>} An array of locators representing each row's checkbox input.
     */
    async getAllRowCheckboxInputs(): Promise<Locator[]> {
        return this.tableRows.locator('input[type="checkbox"]').all();
    }
}