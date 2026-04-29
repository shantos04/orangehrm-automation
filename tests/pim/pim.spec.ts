/**
 * @fileoverview Test suite for the PIM Employee List page.
 * Focuses on filtering capabilities and UI components like custom dropdowns.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../app/pages/login.page';
import { PimPage } from '../../app/pages/pim.page';
import { ToastComponent } from '../../app/components/common/toast.component';
import { getExpectedSortedArray } from '../../utils/sort-helper';

import usersData from '../../data/users.json';
import expectedTexts from '../../data/expected-texts.json';

test.describe("PIM Module - Employee List Filters", () => {
    let loginPage: LoginPage;
    let pimPage: PimPage;
    let toastComponent: ToastComponent;

    /**
     * Setup: Authentication and navigation to the PIM Employee List.
     */
    test.beforeEach(async ({ page }) => {
        // Increase timeout for stable execution
        test.setTimeout(60000);

        loginPage = new LoginPage(page);
        pimPage = new PimPage(page);
        toastComponent = new ToastComponent(page);

        // Pre-condition: Login and go to Employee List
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);

        // Wait for the login redirect to complete successfully
        await page.waitForURL('**/dashboard/index');

        // Direct navigation to Employee List page
        await page.goto('/web/index.php/pim/viewEmployeeList');

        // Synchronize UI State before excuting test scope
        await expect(pimPage.tableContainer).toBeVisible();
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });
    });

    /**
     * Test Case: Verify the default selected value of the 'Include' dropdown.
     * Assertion: Ensures the system defaults to 'Current Employees Only'.
     */
    test("OrangeHRM_PIM_TC01_VerifyDefaultIncludeFilter", async () => {
        const expectedDefault = expectedTexts.dropdownOptions.include.default;

        // Check if the dropdown displays the correct initial text
        await expect(pimPage.dropdownInclude).toHaveText(expectedDefault);
    });

    /**
     * Test Case: Verify that the 'Include' dropdown updates correctly when selecting 'Past Employees Only'.
     * Assertion: Functional check for custom dropdown selection logic.
     */
    test("OrangeHRM_PIM_TC02_SelectPastEmployeesFilter", async () => {
        const optionToSelect = expectedTexts.dropdownOptions.include.past;

        // Perform selection using the POM method
        await pimPage.selectIncludeOption(optionToSelect);

        // Assert the new value is displayed
        await expect(pimPage.dropdownInclude).toHaveText(optionToSelect);
    });

    /**
     * Test Case: Verify that clicking 'Reset' reverts the 'Include' dropdown to its default state.
     * Assertion: Ensures the Reset button correctly clears filter state.
     */
    test("OrangeHRM_PIM_TC03_VerifyResetIncludeFilter", async () => {
        const defaultValue = expectedTexts.dropdownOptions.include.default;
        const otherValue = expectedTexts.dropdownOptions.include.both;

        // Change the dropdown value to something else
        await pimPage.selectIncludeOption(otherValue);
        await expect(pimPage.dropdownInclude).toHaveText(otherValue);

        // Click the Reset button
        await pimPage.clickResetButton();

        // Verify it returns to the default value
        await expect(pimPage.dropdownInclude).toHaveText(defaultValue);
    });

    /**
     * Test Case: Verify that the Employee List data table displays all required column headers.
     * Assertion: Ensures the table structure is correct, containing the master checkbox, specific text columns, and the exact total column count.
     */
    test("OrangeHRM_PIM_TC04_VerifyRequiredTableHeaders", async ({ page }) => {

        // Verify master Checkbox in the Header (first column, no text)
        await expect(pimPage.masterCheckbox).toBeVisible();

        // Define the expected text for all other columns
        const expectedTextHeaders = [
            "Id",
            "First (& Middle) Name",
            "Last Name",
            "Job Title",
            "Employment Status",
            "Sub Unit",
            "Supervisor",
            "Actions"
        ]

        // Loop through the array and verify each header 
        for (const headerName of expectedTextHeaders) {
            // Escape special characters to prevent Regex errors
            const escapedHeader = headerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Create a Regex to match the exact start of the header text
            const exactWordRegex = new RegExp('^\\s*' + escapedHeader);

            // Filter the column headers by the exact regex and verify visibility
            const specificHeader = pimPage.columnHeaders.filter({ hasText: exactWordRegex });
            await expect(specificHeader).toBeVisible();
        }

        // Verify the total number of columns matches the expected count (text columns + 1 checkbox)
        const expectedTotalColumns = expectedTextHeaders.length + 1;
        await expect(pimPage.columnHeaders).toHaveCount(expectedTotalColumns);
    });

    /**
     * Test Case: Verify Default Table Data Population (Schema Validation).
     * Assertion: Ensures the data table successfully loads default records, contains at least one row, and the front-end correctly renders vital data fields (ID and First Name) without empty values.
     */
    test("OrangeHRM_PIM_TC05_VerifyDefaultTableDataPopulation", async () => {
        // Wait for the table container to be visible and the loading spinner to disappear
        await expect(pimPage.tableContainer).toBeVisible();
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

        // Retrieve all currently visible rows in the data table
        const allRows = await pimPage.tableRows.all();

        // Assert that the table is not empty (contains at least one record)
        expect(allRows.length).toBeGreaterThan(0);

        // Extract text from all cells of the first row to verify the data structure (Schema validation)
        const firstRowTexts = await allRows[0].locator('.oxd-table-cell').allInnerTexts();

        // Map the extracted text to specific variables (Index 0 is the checkbox, Index 1 is ID, Index 2 is First Name)
        const id = firstRowTexts[1].trim();
        const firstName = firstRowTexts[2].trim();

        // Assert that the front-end successfully renders valid data (ID and First Name are not empty strings)
        expect(id).not.toBe('');
        expect(firstName).not.toBe('');
    });

    /**
     * Test Case: Verify that searching for a non-existent employee displays a 'No Records Found' message.
     * Assertion: Ensures the system handles empty search results gracefully by showing the correct toast notification.
     */
    test("OrangeHRM_PIM_TC06_VerifyNoRecordsFoundMessage", async () => {
        const expectedTextResult = expectedTexts.toastMessages.noRecordsFound;

        // Input a deliberately invalid or non-existent employee name
        await pimPage.txtEmployeeName.fill('Not an employee');

        // Click search and simultaneously wait for the toast notification to be visible
        await Promise.all([
            expect(toastComponent.toastMessage).toBeVisible(),
            pimPage.btnSearch.click()
        ])

        // Verify the toast message contains the expected 'No Records Found' text (case-insensitive)
        await expect(toastComponent.toastMessage).toContainText(expectedTextResult, { ignoreCase: true });
    });

    /**
     * Test Case: Verify Ascending Sort on ID.
     * Assertion: Ensures that after applying the Ascending sort filter, the UI displays the First Name column in strictly alphabetical (A-Z) order.
     */
    test("OrangeHRM_PIM_TC07_VerifyAscendingSortOnId", async () => {
        // Click the sort icon on the 'Id' column header and select 'Ascending'
        await pimPage.sortColumnBy('Id', 'Ascending');

        // Wait for the data table to finish loading the sorted results
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

        // Retrieve actual data
        const actualIds = await pimPage.getColumnTextsByIndex(1, true);

        // The 'isNumeric' flag is set to true to correctly handle alphanumeric IDs (e.g., EMP01, EMP10)
        const expectedSortedIds = getExpectedSortedArray(actualIds, 'Ascending', false);

        // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
        expect(actualIds).toEqual(expectedSortedIds);
    });

    /**
     * Test Case: Verify Descending Sort on ID.
     * Assertion: Ensures that after applying the Ascending sort filter, the UI displays the First Name column in strictly alphabetical (A-Z) order.
     */
    test("OrangeHRM_PIM_TC08_VerifyDescendingSortOnId", async () => {
        // Click the sort icon on the 'Id' column header and select 'Ascending'
        await pimPage.sortColumnBy('Id', 'Descending');

        // Wait for the data table to finish loading the sorted results
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

        // Retrieve actual data
        const actualIds = await pimPage.getColumnTextsByIndex(1, true);

        // The 'isNumeric' flag is set to true to correctly handle alphanumeric IDs (e.g., EMP01, EMP10)
        const expectedSortedIds = getExpectedSortedArray(actualIds, 'Descending', false);

        // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
        expect(actualIds).toEqual(expectedSortedIds);
    });

    /**
     * Test Case: Verify Ascending Sort on First Name.
     * Assertion: Ensures that after applying the Ascending sort filter, the UI displays the First Name column in strictly alphabetical order.
     */
    test("OrangeHRM_PIM_TC09_VerifyAscendingSortOnFirstname", async () => {
        // Click the sort icon on the 'First (& Middle) Name' column header and select 'Ascending'
        await pimPage.sortColumnBy('First (& Middle) Name', 'Ascending');

        // Wait for the data table to finish loading the sorted results
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

        // Scrape the actual First Names displayed on the current page
        const actualFirstNames = await pimPage.getColumnTextsByIndex(2, true);

        // isNumeric MUST be false for textual columns like First Name
        const expectedSortedFirstNames = getExpectedSortedArray(actualFirstNames, 'Ascending', false);

        // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
        expect(actualFirstNames).toEqual(expectedSortedFirstNames);
    });

    /**
     * Test Case: Verify Descending Sort on First Name.
     * Assertion: Ensures that after applying the Descending sort filter, the UI displays the First Name column in strictly alphabetical order.
     */
    test("OrangeHRM_PIM_TC10_VerifyDescendingSortOnFirstname", async () => {
        // Click the sort icon on the 'First (& Middle) Name' column header and select 'Descending'
        await pimPage.sortColumnBy('First (& Middle) Name', 'Descending');

        // Wait for the data table to finish loading the sorted results
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

        // Scrape the actual First Names displayed on the current page
        const actualFirstNames = await pimPage.getColumnTextsByIndex(2, true);

        // isNumeric MUST be false for textual columns like First Name
        const expectedSortedFirstNames = getExpectedSortedArray(actualFirstNames, 'Descending', false);

        // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
        expect(actualFirstNames).toEqual(expectedSortedFirstNames);
    });

    /**
     * Test Case: Verify Ascending Sort on Last Name.
     * Assertion: Ensures that after applying the Ascending sort filter, the UI displays the First Name column in strictly alphabetical order.
     */
    test("OrangeHRM_PIM_TC11_VerifyAscendingSortOnLastname", async () => {
        // Click the sort icon on the 'Last Name' column header and select 'Ascending'
        await pimPage.sortColumnBy('Last Name', 'Ascending');

        // Wait for the data table to finish loading the sorted results
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

        // Scrape the actual Last Names displayed on the current page
        const actualLastNames = await pimPage.getColumnTextsByIndex(3, true);

        // isNumeric MUST be false for textual columns like Last Name
        const expectedSortedLastNames = getExpectedSortedArray(actualLastNames, 'Ascending', false);

        // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
        expect(actualLastNames).toEqual(expectedSortedLastNames);
    });

    /**
     * Test Case: Verify Descending Sort on Last Name.
     * Assertion: Ensures that after applying the Descending sort filter, the UI displays the First Name column in strictly alphabetical order.
     */
    test("OrangeHRM_PIM_TC12_VerifyDescendingSortOnLastname", async () => {
        // Click the sort icon on the 'Last Name' column header and select 'Descending'
        await pimPage.sortColumnBy('Last Name', 'Descending');

        // Wait for the data table to finish loading the sorted results
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

        // Scrape the actual Last Names displayed on the current page
        const actualLastNames = await pimPage.getColumnTextsByIndex(3, true);

        // isNumeric MUST be false for textual columns like Last Name
        const expectedSortedLastNames = getExpectedSortedArray(actualLastNames, 'Descending', false);

        // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
        expect(actualLastNames).toEqual(expectedSortedLastNames);
    });

    /**
     * Test Case: Verify Pagination - Next Page navigation.
     * Assertion: Ensures clicking the 'Next' button loads a new set of records and updates the URL or table state.
     */
    test("OrangeHRM_PIM_TC13_VerifyPaginationNextPage", async () => {
        const isNextBtnVisible = await pimPage.btnNextPage.isVisible();

        test.skip(!isNextBtnVisible, 'Not enough records to trigger pagination');

        const firstIdPage1 = await pimPage.getFirstRowIdText();

        await pimPage.btnNextPage.click();
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

        const firstIdPage2 = await pimPage.getFirstRowIdText();

        expect(firstIdPage1).not.toEqual(firstIdPage2);
    })

    /**
     * Test Case: Verify Single Row Selection.
     * Assertion: Ensure clicking a row's checkbox selects only that specific row.
     */
    test("OrangeHRM_PIM_TC14_VerifySingleRowSelection", async () => {
        // Click the custom checkbox wrapper on the first row
        await pimPage.checkFirstRowCheckbox();

        // Verify the hidden input of the element row is updated to 'checked' state
        await expect(pimPage.getFirstRowCheckboxInput()).toBeChecked();

        // Ensure the Master Checkbox remains checked
        await expect(pimPage.masterCheckboxInput).toBeChecked();
    });

    /**
     * Test Case: Verify Master Checkbox functionality.
     * Assertion: Ensures clicking the table header's master checkbox selects all currently visible rows.
     */
    test("OrangeHRM_PIM_TC15_VerifyMasterCheckboxSelectsAll", async () => {
        // Click the master checkbox located in the table header
        await pimPage.masterCheckbox.click();

        // Retrieve all actual hidden input checkboxes for every visible row
        const allRowCheckboxInputs = await pimPage.getAllRowCheckboxInputs();

        // Loop through and explicitly verify 100% of the visible rows are checked
        for (const checkboxInput of allRowCheckboxInputs) {
            await expect(checkboxInput).toBeChecked();
        }
    });

    /**
     * Test Case: Verify Master Checkbox state across pagination.
     * Assertion: Ensures that selecting the master checkbox on Page 1 does NOT select rows on Page 2, and the master checkbox resets its state.
     */
    test("OrangeHRM_PIM_TC16_VerifyMasterCheckboxAcrossPagination", async () => {
        // Verify if the table has enough data to support pagination
        const isNextBtnVisible = await pimPage.btnNextPage.isVisible();

        // Skip this test if there is only one page
        test.skip(!isNextBtnVisible, 'Not enough records to test pagination behavior.');

        // Check the master checkbox on Page 1
        await pimPage.masterCheckbox.click();

        // Verify Page 1 master checkbox is successfully checked
        await expect(pimPage.masterCheckboxInput).toBeChecked();

        // Navigate to Page 2 and synchronize UI state
        await pimPage.btnNextPage.click();
        await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

        // On Page 2, the Master Checkbox MUST explicitly be UNCHECKED
        await expect(pimPage.masterCheckboxInput).not.toBeChecked();

        // All employee rows on Page 2 MUST NOT carry over the checked state
        const allRowCheckboxInputs = await pimPage.getAllRowCheckboxInputs();

        for (const checkboxInput of allRowCheckboxInputs) {
            await expect(checkboxInput).not.toBeChecked();
        }
    });


});