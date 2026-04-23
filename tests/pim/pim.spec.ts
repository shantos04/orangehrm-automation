/**
 * @fileoverview Test suite for the PIM Employee List page.
 * Focuses on filtering capabilities and UI components like custom dropdowns.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../app/pages/login.page';
import { PimPage } from '../../app/pages/pim.page';
import usersData from '../../data/users.json';
import expectedTexts from '../../data/expected-texts.json';

test.describe("PIM Module - Employee List Filters", () => {
    let loginPage: LoginPage;
    let pimPage: PimPage;

    /**
     * Setup: Authentication and navigation to the PIM Employee List.
     */
    test.beforeEach(async ({ page }) => {
        // Increase timeout for stable execution
        test.setTimeout(60000);

        loginPage = new LoginPage(page);
        pimPage = new PimPage(page);

        // Pre-condition: Login and go to Employee List
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);
        
        // Direct navigation to Employee List page
        await page.goto('/web/index.php/pim/viewEmployeeList');
    });

    /**
     * Test Case: Verify the default selected value of the 'Include' dropdown.
     * Assertion: Ensures the system defaults to 'Current Employees Only'.
     */
    test("OrangeHRM_PIM_TC11_VerifyDefaultIncludeFilter", async () => {
        const expectedDefault = expectedTexts.dropdownOptions.include.default;
        
        // Check if the dropdown displays the correct initial text
        await expect(pimPage.dropdownInclude).toHaveText(expectedDefault);
    });

    /**
     * Test Case: Verify that the 'Include' dropdown updates correctly when selecting 'Past Employees Only'.
     * Assertion: Functional check for custom dropdown selection logic.
     */
    test("OrangeHRM_PIM_TC12_SelectPastEmployeesFilter", async () => {
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
    test("OrangeHRM_PIM_TC13_VerifyResetIncludeFilter", async () => {
        const defaultValue = expectedTexts.dropdownOptions.include.default;
        const otherValue = expectedTexts.dropdownOptions.include.both;

        // 1. Change the dropdown value to something else
        await pimPage.selectIncludeOption(otherValue);
        await expect(pimPage.dropdownInclude).toHaveText(otherValue);
        
        // 2. Click the Reset button
        await pimPage.btnReset.click();

        // 3. Verify it returns to the default value
        await expect(pimPage.dropdownInclude).toHaveText(defaultValue);
    });
});