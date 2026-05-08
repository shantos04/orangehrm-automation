/**
 * @fileoverview Page Object Model for the PIM Employee List page.
 * Encapsulates locators and UI interaction methods for employee filtering, sorting, and data extraction.
 * Inherits from BasePage to utilize common elements like global loading spinners.
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { ToastComponent } from '../../components/common/toast.component';

import expectedTexts from '../../../data/expected-texts.json';

export class PimPage extends BasePage {
    // --- Search Filter Locators ---
    readonly dropdownInclude: Locator;
    readonly txtEmployeeName: Locator;
    readonly txtEmployeeId: Locator;
    readonly txtSupervisorName: Locator;

    // --- Dropdown Extractors for Validation ---
    readonly lblSelectedJobTitle: Locator;
    readonly lblSelectedEmpStatus: Locator;
    readonly lblSelectedSubUnit: Locator;

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

        // --- Input ---
        this.dropdownInclude = page.locator('.oxd-input-group').filter({ hasText: 'Include' }).locator('.oxd-select-text');
        this.txtEmployeeName = page.getByPlaceholder('Type for hints...').first();
        this.txtEmployeeId = page.locator('.oxd-input-group').filter({hasText: 'Employee Id'}).locator('input');
        this.txtSupervisorName = page.locator('.oxd-input-group').filter({hasText: 'Supervisor Name'}).locator('input');

        // --- Extractors ---
        this.lblSelectedJobTitle = page.locator('.oxd-input-group').filter({hasText: 'Job Title'}).locator('.oxd-select-text');
        this.lblSelectedEmpStatus = page.locator('.oxd-input-group').filter({hasText: 'Employment Status'}).locator('.oxd-select-text');
        this.lblSelectedSubUnit = page.locator('.oxd-input-group').filter({hasText: 'Sub Unit'}).locator('.oxd-select-text');

        // --- Table ---
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
     * Helper method to interact with custom div/span-based dropdowns.
     * It utilizes explicitly defined locators from the constructor to expand the menu and select a specific option.
     * * @param {Locator} dropdownLocator - The specific Playwright Locator for the dropdown wrapper.
     * @param {string} optionToSelect - The exact text of the option to select from the list.
     */
    private async selectDropdownOption(dropdownLocator: Locator, optionToSelect: string) {
        // 1. Click the provided locator to expand the dropdown menu
        await dropdownLocator.click();

        // 2. Wait for the listbox popup to become fully visible, then select the target option
        const activeListbox = this.page.getByRole('listbox');
        await activeListbox.waitFor({ state: 'visible' });
        await activeListbox.getByRole('option', {name: optionToSelect}).click()
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

    /**
     * Comprehensive search method utilizing explicitly defined locators.
     * Supports Data-Driven Testing by dynamically filling inputs and selecting dropdowns based on the provided data object.
     * * @param {Object} searchData - An object containing optional search parameters.
     * @param {string} [searchData.employeeName] - Target employee name.
     * @param {string} [searchData.employeeId] - Target employee ID.
     * @param {string} [searchData.supervisorName] - Target supervisor name.
     * @param {string} [searchData.employmentStatus] - Exact text for the Employment Status dropdown.
     * @param {string} [searchData.include] - Exact text for the Include dropdown.
     * @param {string} [searchData.jobTitle] - Exact text for the Job Title dropdown.
     * @param {string} [searchData.subUnit] - Exact text for the Sub Unit dropdown.
     * @param {boolean} [submitSearch=true] - Determines whether to click the search button and wait for loading after filling the form. Defaults to true.
     */
    public async searchEmployee(
        searchData: {
            employeeName?: string,
            employeeId?: string,
            supervisorName?: string,
            employmentStatus?: string,
            include?: string,
            jobTitle?: string,
            subUnit?: string
        },
        submitSearch: boolean = true
    ) {
        // --- Process Text Inputs ---
        if (searchData.employeeName) await this.txtEmployeeName.fill(searchData.employeeName);
        if (searchData.employeeId) await this.txtEmployeeId.fill(searchData.employeeId);
        if (searchData.supervisorName) await this.txtSupervisorName.fill(searchData.supervisorName);

        // --- Process Custom Dropdowns (Utilizing the Helper Method) ---
        if (searchData.employmentStatus) {
            await this.selectDropdownOption(this.lblSelectedEmpStatus, searchData.employmentStatus);
        }
        if (searchData.include) {
            await this.selectDropdownOption(this.dropdownInclude, searchData.include);
        }
        if (searchData.jobTitle) {
            await this.selectDropdownOption(this.lblSelectedJobTitle, searchData.jobTitle);
        }
        if (searchData.subUnit) {
            await this.selectDropdownOption(this.lblSelectedSubUnit, searchData.subUnit);
        }

        /// --- Trigger Search and Wait for Completion (Conditional) ---
        if (submitSearch) {
            await this.btnSearch.click();
            await this.waitForGlobalLoading();
        }
    }

    // ========================================================
    // --- Verification Keywords (Step Verify) ---
    // ========================================================

    /**
     * KEYWORD STEP VERIFY: Search Form State
     * Verifies that the input fields and dropdowns in the Employee Information search form
     * retain the correct values after a search or reset action.
     * @param {Object} expectedState - An object containing the exact values expected to be visible in the form fields.
     * @param {string} [expectedState.employeeName] - Expected value in the Employee Name input.
     * @param {string} [expectedState.employeeId] - Expected value in the Employee Id input.
     * @param {string} [expectedState.supervisorName] - Expected value in the Supervisor Name input.
     * @param {string} [expectedState.employmentStatus] - Expected text in the Employment Status dropdown label.
     * @param {string} [expectedState.include] - Expected text in the Include dropdown label.
     * @param {string} [expectedState.jobTitle] - Expected text in the Job Title dropdown label.
     * @param {string} [expectedState.subUnit] - Expected text in the Sub Unit dropdown label.
     */
    public async verifySearchFormState(expectedState: {
        employeeName?: string,
        employeeId?: string,
        supervisorName?: string,
        employmentStatus?: string,
        include?: string,
        jobTitle?: string,
        subUnit?: string
    }) {
        // --- Verify Text Inputs ---
        if (expectedState.employeeName) {
            await expect(this.txtEmployeeName).toHaveValue(expectedState.employeeName);
        }
        if (expectedState.employeeId) {
            await expect(this.txtEmployeeId).toHaveValue(expectedState.employeeId);
        }
        if (expectedState.supervisorName) {
            await expect(this.txtSupervisorName).toHaveValue(expectedState.supervisorName);
        }

        // --- Verify Dropdowns ---
        if (expectedState.employmentStatus) {
            await expect(this.lblSelectedEmpStatus).toHaveText(expectedState.employmentStatus);
        }
        if (expectedState.include) {
            await expect(this.dropdownInclude).toHaveText(expectedState.include);
        }
        if (expectedState.jobTitle) {
            await expect(this.lblSelectedJobTitle).toHaveText(expectedState.jobTitle);
        }
        if (expectedState.subUnit) {
            await expect(this.lblSelectedSubUnit).toHaveText(expectedState.subUnit);
        }
    }

    /**
     * KEYWORD STEP VERIFY: Valid Search Results
     * Verifies that the data table displays results, and the first row matches the expected search criteria.
     * Maps the expected data to specific column indexes in the OrangeHRM table.
     * * @param {Object} expectedData - An object containing the exact values expected in the first row.
     * @param {string} [expectedData.employeeId] - Expected text in the ID column.
     * @param {string} [expectedData.employeeName] - Expected text to be contained within the row (First/Last name).
     * @param {string} [expectedData.jobTitle] - Expected text in the Job Title column.
     * @param {string} [expectedData.employmentStatus] - Expected text in the Employment Status column.
     * @param {string} [expectedData.subUnit] - Expected text in the Sub Unit column.
     * @param {string} [expectedData.supervisorName] - Expected text in the Supervisor column.
     */ 
    public async verifySearchResultsMatch(expectedData: {
        employeeName?: string,
        employeeId?: string,
        supervisorName?: string,
        employmentStatus?: string,
        include?: string,
        jobTitle?: string,
        subUnit?: string
    }) {
        // Assert that the table is not empty and at least one row is visible
        const firstRow = this.tableRows.first();
        await expect(firstRow).toBeVisible();

        // Retrieve all cells for the first row to perform targeted assertions
        // Column Index Mapping: 1=Id, 2=Firstname, 3=Lastname, 4=jobTitle, 5=EmploymentStatus, 6=SubUnit, 7=Supervisor
        const cells = firstRow.locator('.oxd-table-cell');

        // Dynamically assert only the fields that were passed in the expectedData object
        if (expectedData.employeeId) {
            await expect(cells.nth(1)).toHaveText(expectedData.employeeId);
        }   
        if (expectedData.employeeName) {
            // Because Employee Name is split into First and Last Name columns (nth 2 and 3), 
            // using a broad toContainText on the entire row is safer and more resilient.
            await expect(firstRow).toContainText(expectedData.employeeName);
        }
        if (expectedData.jobTitle) {
            await expect(cells.nth(4)).toContainText(expectedData.jobTitle);
        }
        if (expectedData.employmentStatus) {
            await expect(cells.nth(5)).toHaveText(expectedData.employmentStatus);
        }
        if (expectedData.subUnit) {
            await expect(cells.nth(6)).toHaveText(expectedData.subUnit);
        }
        if (expectedData.supervisorName) {
            await expect(cells.nth(7)).toHaveText(expectedData.supervisorName);
        }
    }

    /**
     * KEYWORD STEP VERIFY: Invalid Search / No Results
     * Verifies that the system correctly handles empty search results by displaying a toast notification
     * and rendering an empty data table.
     */
    public async verifyNoRecordsFoundMessage() {
        // Instantiate the shared ToastComponent using the current page context
        const toastComponent = new ToastComponent(this.page);

        // Assert that the toast container appears and contains the expected text
        // Utilizing the locator defined within ToastComponent
        await expect(toastComponent.toastMessage).toBeVisible();
        await expect(toastComponent.toastMessage).toContainText(expectedTexts.toastMessages.noRecordsFound);
        await expect(this.tableRows).toHaveCount(0);
    }
}