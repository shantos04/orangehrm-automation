/**
 * @fileoverview Test suite for the PIM Employee List page.
 * Focuses on filtering capabilities and UI components like custom dropdowns.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../app/pages/login.page';
import { PimPage } from '../../app/pages/pim.page';
import { ToastComponent } from '../../app/components/common/toast.component';

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
        await pimPage.btnReset.click();

        // Verify it returns to the default value
        await expect(pimPage.dropdownInclude).toHaveText(defaultValue);
    });

    /**
     * Test Case: Verify that the Employee List data table displays all required column headers.
     * Assertion: Ensures the table structure is correct, containing the master checkbox, specific text columns, and the exact total column count.
     */
    test("OrangeHRM_PIM_TC04_VerifyRequiredTableHeaders", async ({ page }) => {

        // Verify master Checkbox in the Header (first column, no text)
        const masterCheckbox = pimPage.tableHeaderRow.locator('.oxd-checkbox-wrapper');
        await expect(masterCheckbox).toBeVisible();

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
     * Test Case: Verify that searching for a non-existent employee displays a 'No Records Found' message.
     * Assertion: Ensures the system handles empty search results gracefully by showing the correct toast notification.
     */
    test("OrangeHRM_PIM_TC05_VerifyNoRecordsFoundMessage", async ({ page }) => {
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
});