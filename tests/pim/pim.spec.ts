/**
 * @fileoverview Test suite for the PIM Employee List page.
 * Focuses on filtering capabilities and UI components like custom dropdowns.
 */

import { test, expect } from '@playwright/test';
import * as allure from "allure-js-commons";

import { LoginPage } from '../../app/pages/login.page';
import { PimPage } from '../../app/pages/pim/pim.page';
import { ToastComponent } from '../../app/components/common/toast.component';
import { getExpectedSortedArray } from '../../utils/sort-helper';
import {PimTopMenuComponent} from '../../app/components/pim/pim-top-menu.component';

import usersData from '../../data/users.json';
import employeeData from '../../data/employee-data.json';
import expectedTexts from '../../data/expected-texts.json';

test.describe("PIM Module - Employee List Filters", () => {
    let loginPage: LoginPage;
    let pimPage: PimPage;
    let toastComponent: ToastComponent;
    let pimTopMenu: PimTopMenuComponent;

    /**
     * Setup: Authentication and navigation to the PIM Employee List.
     */
    test.beforeEach(async ({ page }) => {
        // --- Allure Metadata ---
        await allure.epic("PIM Module");
        await allure.feature("Employee List functionality");

        // Increase timeout for stable execution
        test.setTimeout(60000);

        loginPage = new LoginPage(page);
        pimPage = new PimPage(page);
        toastComponent = new ToastComponent(page);
        pimTopMenu = new PimTopMenuComponent(page);

        // Pre-condition: Login and go to Employee List
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);

        // Wait for the login redirect to complete successfully
        await page.waitForURL('**/dashboard/index');

        // Direct navigation to Employee List page
        await page.goto('/web/index.php/pim/viewEmployeeList');

        // Synchronize UI State before excuting test scope
        await expect(pimPage.tableContainer).toBeVisible();
        await pimPage.waitForGlobalLoading();
    });

    /**
     * Test Case: Verify Default Table Data Population (Schema Validation).
     * Assertion: Ensures the data table successfully loads default records, contains at least one row, and the front-end correctly renders vital data fields (ID and First Name) without empty values.
     */
    test("OrangeHRM_PIM_TC01_VerifyDefaultTableDataPopulation", async () => {
        await allure.story("Data Population - Default Table Schema Validation");
        await allure.severity("critical");

        await test.step("Verify: Default table data is populated and valid", async () => {
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
    });

    /**
     * Test Case: Verify Search by exact, existing Employee ID.
     * Assertion: Ensures searching by a valid ID filters the table to show the correct matching record.
     */
    test("OrangeHRM_PIM_TC02_VerifySearchByValidEmployeeId", async () => {
        await allure.story("Data-Driven Search - Valid Employee ID");
        await allure.severity("critical");

        // Retrieve the valid ID from the external JSON data file
        const targetId = employeeData.searchEmployeeById.validEmployeeId;

        await test.step("Action: Input the data-driven ID into the search field and submit", async () => {
            // Input the data-driven ID into the search field and submit
            await pimPage.searchEmployee({ employeeId: targetId });
        });

        await test.step("Verify: Form retained the ID, and results match exactly", async () => {
            // Verify the form retains the inputted values
            await pimPage.verifySearchFormState({ employeeId: targetId });

            // Assertion - Verify the ID in the first returned row exactly matches the searched ID
            await pimPage.verifySearchResultsMatch({ employeeId: targetId });
        });
    });

    /**
     * Test Case: Verify Search by partial Employee Name across both First and Last Name columns.
     * Assertion: Ensures the system's wildcard search logic correctly filters records containing the substring in either name field.
     */
    test("OrangeHRM_PIM_TC03_VerifySearchByPartialName", async ({page}, testInfo) => {
        await allure.story("Data-Driven Search - Partial String Matching");
        await allure.severity("critical");

        const partialName = employeeData.searchEmployeeByName.partialName;

        await test.step("Action: Input a partial string into the Employee Name field and submit", async () => {
            await pimPage.searchEmployee({employeeName: partialName});
        });

        await test.step("Verify: ALL returned rows must strictly contain the partial substring in EITHER firstname or lastname", async () => {
            // Retrieve data from both columns simultaneously 
            // Index 2 = First (& Middle) Name | Index 3 = Last Name
            const actualFirstNames = await pimPage.getColumnTextsByIndex(2, false);
            const actualLastNames = await pimPage.getColumnTextsByIndex(3, false);

            // Ensure at least one record is returned to avoid false positives
            expect(actualFirstNames.length, "Search returned empty results, expected at least one match.").toBeGreaterThan(0);
            expect(actualFirstNames.length, "DOM Structure Error: First Name and Last Name column counts mismatch!").toEqual(actualLastNames.length);
           
            // Loop through every single result to verify strict matching on both columns
            for (let i = 0; i < actualFirstNames.length; i++) {
                // Convert all strings to lowercase to ensure case-insensitive comparison
                const firstName = actualFirstNames[i].toLowerCase();
                const lastName = actualLastNames[i].toLowerCase();
                const keyword = partialName.toLowerCase();

                // Logic OR (||): Returns true if the keyword exists in either the First Name OR the Last Name
                const isMatch = firstName.includes(keyword) || lastName.includes(keyword);

                // If a row fails the check, capture a screenshot and throw a detailed error
                if (!isMatch) {
                    const screenshotBuffer = await page.screenshot({ fullPage: true });
                    
                    await testInfo.attach(`Defect-Row-${i + 1}-Screenshot`, {
                        body: screenshotBuffer,
                        contentType: 'image/png'
                    });
                    
                    expect(isMatch, `Search Filter Defect: Row ${i + 1} displays Full Name "${actualFirstNames[i]} ${actualLastNames[i]}" which does NOT contain the keyword "${partialName}" in either column.`).toBeTruthy();
                };
            };
        });
    });

    /**
     * Test Case: Verify combining multiple search criteria.
     * Assertion: Ensures the search engine processes AND conditions correctly.
     */
    test("OrangeHRM_PIM_TC04_VerifyCombinedSearchCriteria", async ({page}, testInfo) => {
        await allure.story("Advanced Search - Combined Filters(AND Logic)");
        await allure.severity("critical");

        const targetName = employeeData.searchEmployeeByName.validName;
        const targetId = employeeData.searchEmployeeById.validEmployeeId;

        await test.step("Action: Fill multiple search fields (Name and ID) and submit", async () => {
            await pimPage.searchEmployee({
                employeeName: targetName,
                employeeId: targetId
            });
        });

        await test.step("Verify: Results strictly match both criteria", async () => {
            // Retrieve data from ID, First Name, and Last Name columns
            const actualIds = await pimPage.getColumnTextsByIndex(1, true);
            const actualFirstNames = await pimPage.getColumnTextsByIndex(2, false);
            const actualLastNames = await pimPage.getColumnTextsByIndex(3, false);

            // Defensive checks: Ensure we have results and all columns have the exact same number of rows
            expect(actualIds.length, "Search returned empty results, expected at least 1 match.").toBeGreaterThan(0);
            expect(actualFirstNames.length, "DOM Structure Error: First Name count mismatch!").toEqual(actualIds.length);
            expect(actualLastNames.length, "DOM Structure Error: Last Name count mismatch!").toEqual(actualIds.length);

            // Loop through every single row to verify the strict AND logic
            for (let i = 0; i < actualIds.length; i++) {
                const firstName = actualFirstNames[i].toLowerCase();
                const lastName = actualLastNames[i].toLowerCase();
                const keywordName = targetName.toLowerCase();

                // 1. Check if the Name matches (either First OR Last)
                const isNameMatch = firstName.includes(keywordName) || lastName.includes(keywordName);
                
                // 2. Check if the ID matches exactly
                const isIdMatch = actualIds[i] === targetId;

                // 3. Both conditions MUST be true
                const isFullMatch = isNameMatch && isIdMatch;

                if (!isFullMatch) {
                    // Capture buffer and attach to Allure Report on failure
                    const screenshotBuffer = await page.screenshot({ fullPage: true });
                    await testInfo.attach(`Defect-Row-${i + 1}-Combined-Search`, {
                        body: screenshotBuffer,
                        contentType: 'image/png'
                    });
                    
                    expect(isFullMatch, `Search Filter Defect: Row ${i + 1} fails combined search. Found Name: "${actualFirstNames[i]} ${actualLastNames[i]}", ID: "${actualIds[i]}"`).toBeTruthy();
                };
            };
        });
    });

    /**
     * Test Case: Verify Search by non-existent Employee ID (Data-Driven).
     * Assertion: Ensures searching for an invalid ID from the JSON data file returns no records and displays a toast notification.
     */
    test("OrangeHRM_PIM_TC05_VerifySearchByInvalidEmployeeId", async () => {
        await allure.story("Data-Driven Search - Invalid Employee ID Handling");
        await allure.severity("major");

        // Retrieve the invalid ID from the JSON data file
        const invalidId = employeeData.searchEmployeeById.invalidEmployeeId;

        await test.step("Action: Input the invalid ID into the search field", async () => {
            // Input the invalid ID into the search field
            await pimPage.searchEmployee({ employeeId: invalidId });
        });

        await test.step("Verify: Verify the toast message contains the correct 'No Records Found' text", async () => {
            // Verify the form retains the inputted values
            await pimPage.verifySearchFormState({ employeeId: invalidId });

            // Verify the toast message contains the correct 'No Records Found' text and table is empty
            await pimPage.verifyNoRecordsFoundMessage();
        });
    });

    /**
     * Test Case: Verify that searching for a non-existent employee displays a 'No Records Found' message.
     * Assertion: Ensures the system handles empty search results gracefully by showing the correct toast notification.
     */
    test("OrangeHRM_PIM_TC06_VerifyNoRecordsFoundMessage", async () => {
        await allure.story("Search Functionality - Empty Results Handling");
        await allure.severity("major");

        const invalidName = employeeData.searchEmployeeByName.invalidName;

        await test.step("Action: Input a deliberately invalid or non-existent employee name", async () => {
            // Input a deliberately invalid or non-existent employee name and submit (default true)
            await pimPage.searchEmployee({ employeeName: invalidName });
        });

        await test.step("Verify: System displays 'No Records Found' and an empty table", async () => {
            // Verify the toast message contains the expected 'No Records Found' text
            await pimPage.verifyNoRecordsFoundMessage();
        });
    });

    /**
     * Test Case: Verify Reset functionality after performing an Employee ID search (Data-Driven).
     * Assertion: Ensures clicking 'Reset' clears the input field and reloads the default table data.
     */
    test("OrangeHRM_PIM_TC07_VerifyResetAfterEmployeeIdSearch", async () => {
        await allure.story("Filter Controls - Reset Search Filters");
        await allure.severity("major");

        // Perform an initial search using a valid ID from the JSON file
        const targetId = employeeData.searchEmployeeById.validEmployeeId;

        await test.step("Action: Perform an initial search using a valid ID from the JSON file", async () => {
            // Perform an initial search using a valid ID from the JSON file
            await pimPage.searchEmployee({ employeeId: targetId });
        });

        await test.step("Action: Click the Reset button to clear all filters", async () => {
            // Click the Reset button to clear all filters
            await pimPage.clickResetButton();
        });

        await test.step("Verify: Verify the Employee ID input field is cleared and default data reloads", async () => {
            // Verify the Employee ID input field is cleared
            await pimPage.verifySearchFormState({ employeeId: '' });

            // Ensure the table reloads the default data (expecting more than 1 row)
            const allRows = await pimPage.tableRows.all();
            expect(allRows.length).toBeGreaterThan(1);
        });
    });

    /**
     * Test Case: Verify Data Sanitization on Search (Leading/Trailing Whitespaces).
     * Assertion: Ensures the system automatically trims whitespaces before executing the database query.
     */
    test("OrangeHRM_PIM_TC08_VerifySearchWhitespaceSanitization", async () => {
        await allure.story("Search Functionality - Data Sanitization");
        await allure.severity("minor");

        const validId = employeeData.searchEmployeeById.validEmployeeId;
        const idWithWhitespaces = `   ${validId}   `;

        await test.step("Action: Input an ID wrapped in leading and trailing whitespace", async () => {
            await pimPage.searchEmployee({employeeId: idWithWhitespaces});
        });

        await test.step("Verify: System trims the input and successfully finds the exact record", async () => {
            await pimPage.verifySearchFormState({ employeeId: validId });
            await pimPage.verifySearchResultsMatch({employeeId: validId});
        });
    });

    /**
     * Test Case: Verify the default selected value of the 'Include' dropdown.
     * Assertion: Ensures the system defaults to 'Current Employees Only'.
     */
    test("OrangeHRM_PIM_TC09_VerifyDefaultIncludeFilter", async () => {
        await allure.story("UI State - Default Filter Values");
        await allure.severity("minor");

        await test.step("Verify: The 'Include' dropdown should default to 'Current Employees Only'", async () => {
            await pimPage.verifySearchFormState({
                include: expectedTexts.dropdownOptions.include.default
            })
        })
    });

    /**
     * Test Case: Verify that the 'Include' dropdown updates correctly when selecting 'Past Employees Only'.
     * Assertion: Functional check for custom dropdown selection logic.
     */
    test("OrangeHRM_PIM_TC10_SelectPastEmployeesFilter", async () => {
        await allure.story("UI Interaction - Custom Dropdown Selection");
        await allure.severity("major");

        const optionToSelect = expectedTexts.dropdownOptions.include.past;

        await test.step("Action: Select 'Past Employees Only' from dropdown", async () => {
            // Perform selection
            await pimPage.searchEmployee({include: optionToSelect}, false);
        })

        await test.step("Verify: The dropdown displays the updated selection", async () => {
            // Assert the new value is displayed
            await pimPage.verifySearchFormState({include: optionToSelect});
        })
    });

    /**
     * Test Case: Verify that clicking 'Reset' reverts the 'Include' dropdown to its default state.
     * Assertion: Ensures the Reset button correctly clears filter state.
     */
    test("OrangeHRM_PIM_TC11_VerifyResetIncludeFilter", async () => {
        await allure.story("Filter Controls - Reset Functionality");
        await allure.severity("major");
        
        const defaultValue = expectedTexts.dropdownOptions.include.default;
        const otherValue = expectedTexts.dropdownOptions.include.both;

        await test.step("Action: Select a non-default value without submitting", async () => {
            // Change the dropdown value to something else without triggering search
            await pimPage.searchEmployee({include: otherValue}, false);
        })

        await test.step("Action: Click Reset button", async () => {
            // Click the Reset button
            await pimPage.clickResetButton();
        })

        await test.step("Verify: The dropdown reverts to its default value", async () => {
            // Verify it returns to the default value
            await pimPage.verifySearchFormState({include: defaultValue});
        })
    });

    /**
     * Test Case: Verify Ascending Sort on ID.
     * Assertion: Ensures that after applying the Ascending sort filter, the UI displays the First Name column in strictly alphabetical (A-Z) order.
     */
    test("OrangeHRM_PIM_TC12_VerifyAscendingSortOnId", async () => {
        await allure.story("Data Sorting - ID Column Ascending");
        await allure.severity("major");

        await test.step("Action: Click the sort icon on the 'Id' column header and select 'Ascending'", async () => {
            // Click the sort icon on the 'Id' column header and select 'Ascending'
            await pimPage.sortColumnBy('Id', 'Ascending');
            
            // Wait for the data table to finish loading the sorted results
            await pimPage.waitForGlobalLoading();
        });

        await test.step("Verify: The UI data strictly matches the programmatically sorted baseline", async () => {
            // Retrieve actual data
            const actualIds = await pimPage.getColumnTextsByIndex(1, true);

            // The 'isNumeric' flag is set to true to correctly handle alphanumeric IDs (e.g., EMP01, EMP10)
            const expectedSortedIds = getExpectedSortedArray(actualIds, 'Ascending', false);

            // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
            expect(actualIds).toEqual(expectedSortedIds);
        });
    });

    /**
     * Test Case: Verify Descending Sort on ID.
     * Assertion: Ensures that after applying the Ascending sort filter, the UI displays the First Name column in strictly alphabetical (A-Z) order.
     */
    test("OrangeHRM_PIM_TC13_VerifyDescendingSortOnId", async () => {
        await allure.story("Data Sorting - ID Column Descending");
        await allure.severity("major");

        await test.step("Action: Click the sort icon on the 'Id' column header and select 'Descending'", async () => {
            // Click the sort icon on the 'Id' column header and select 'Descending'
            await pimPage.sortColumnBy('Id', 'Descending');

            // Wait for the data table to finish loading the sorted results
            await pimPage.waitForGlobalLoading();
        });

        await test.step("Verify: The UI data strictly matches the programmatically sorted baseline", async () => {
            // Retrieve actual data
            const actualIds = await pimPage.getColumnTextsByIndex(1, true);

            // The 'isNumeric' flag is set to true to correctly handle alphanumeric IDs (e.g., EMP01, EMP10)
            const expectedSortedIds = getExpectedSortedArray(actualIds, 'Descending', false);

            // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
            expect(actualIds).toEqual(expectedSortedIds);
        });
    });

    /**
     * Test Case: Verify Ascending Sort on First Name.
     * Assertion: Ensures that after applying the Ascending sort filter, the UI displays the First Name column in strictly alphabetical order.
     */
    test("OrangeHRM_PIM_TC14_VerifyAscendingSortOnFirstname", async () => {
        await allure.story("Data Sorting - First Name Ascending");
        await allure.severity("major");

        await test.step("Action: Click the sort icon on the 'First Name' column header and select 'Ascending'", async () => {
            // Click the sort icon on the 'First (& Middle) Name' column header and select 'Ascending'
            await pimPage.sortColumnBy('First (& Middle) Name', 'Ascending');

            // Wait for the data table to finish loading the sorted results
            await pimPage.waitForGlobalLoading();
        });

        await test.step("Verify: Verify the UI data strictly matches the programmatically sorted baseline", async () => {
            // Scrape the actual First Names displayed on the current page
            const actualFirstNames = await pimPage.getColumnTextsByIndex(2, true);

            // isNumeric MUST be false for textual columns like First Name
            const expectedSortedFirstNames = getExpectedSortedArray(actualFirstNames, 'Ascending', false);

            // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
            expect(actualFirstNames).toEqual(expectedSortedFirstNames);
        });
    });

    /**
     * Test Case: Verify Descending Sort on First Name.
     * Assertion: Ensures that after applying the Descending sort filter, the UI displays the First Name column in strictly alphabetical order.
     */
    test("OrangeHRM_PIM_TC15_VerifyDescendingSortOnFirstname", async () => {
        await allure.story("Data Sorting - First Name Descending");
        await allure.severity("major");

        await test.step("Action: Click the sort icon on the 'First Name' column header and select 'Descending'", async () => {
            // Click the sort icon on the 'First (& Middle) Name' column header and select 'Descending'
            await pimPage.sortColumnBy('First (& Middle) Name', 'Descending');

            // Wait for the data table to finish loading the sorted results
            await pimPage.waitForGlobalLoading();
        });

        await test.step("Verify: Verify the UI data strictly matches the programmatically sorted baseline", async () => {
            // Scrape the actual First Names displayed on the current page
            const actualFirstNames = await pimPage.getColumnTextsByIndex(2, true);

            // isNumeric MUST be false for textual columns like First Name
            const expectedSortedFirstNames = getExpectedSortedArray(actualFirstNames, 'Descending', false);

            // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
            expect(actualFirstNames).toEqual(expectedSortedFirstNames);
        });
    });

    /**
     * Test Case: Verify Ascending Sort on Last Name.
     * Assertion: Ensures that after applying the Ascending sort filter, the UI displays the First Name column in strictly alphabetical order.
     */
    test("OrangeHRM_PIM_TC16_VerifyAscendingSortOnLastname", async () => {
        await allure.story("Data Sorting - Last Name Ascending");
        await allure.severity("major");

        await test.step("Action: Click the sort icon on the 'Last Name' column header and select 'Ascending'", async () => {
            // Click the sort icon on the 'Last Name' column header and select 'Ascending'
            await pimPage.sortColumnBy('Last Name', 'Ascending');

            // Wait for the data table to finish loading the sorted results
            await pimPage.waitForGlobalLoading();
        });

        await test.step("Verify: Verify the UI data strictly matches the programmatically sorted baseline", async () => {
            // Scrape the actual Last Names displayed on the current page
            const actualLastNames = await pimPage.getColumnTextsByIndex(3, true);

            // isNumeric MUST be false for textual columns like Last Name
            const expectedSortedLastNames = getExpectedSortedArray(actualLastNames, 'Ascending', false);

            // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
            expect(actualLastNames).toEqual(expectedSortedLastNames);
        });
    });

    /**
     * Test Case: Verify Descending Sort on Last Name.
     * Assertion: Ensures that after applying the Descending sort filter, the UI displays the First Name column in strictly alphabetical order.
     */
    test("OrangeHRM_PIM_TC17_VerifyDescendingSortOnLastname", async () => {
        await allure.story("Data Sorting - Last Name Descending");
        await allure.severity("major");

        await test.step("Action: Click the sort icon on the 'Last Name' column header and select 'Descending'", async () => {
            // Click the sort icon on the 'Last Name' column header and select 'Descending'
            await pimPage.sortColumnBy('Last Name', 'Descending');

            // Wait for the data table to finish loading the sorted results
            await pimPage.waitForGlobalLoading();
        });

        await test.step("Verify: Verify the UI data strictly matches the programmatically sorted baseline", async () => {
            // Scrape the actual Last Names displayed on the current page
            const actualLastNames = await pimPage.getColumnTextsByIndex(3, true);

            // isNumeric MUST be false for textual columns like Last Name
            const expectedSortedLastNames = getExpectedSortedArray(actualLastNames, 'Descending', false);

            // Assertion: Verify the UI data strictly matches the programmatically sorted baseline
            expect(actualLastNames).toEqual(expectedSortedLastNames);
        });
    });

    /**
     * Test Case: Verify Single Row Selection.
     * Assertion: Ensure clicking a row's checkbox selects only that specific row.
     */
    test("OrangeHRM_PIM_TC18_VerifySingleRowSelection", async () => {
        await allure.story("UI Interaction - Single Row Selection");
        await allure.severity("major");

        await test.step("Action: Click the custom checkbox wrapper on the first row", async () => {
            // Click the custom checkbox wrapper on the first row
            await pimPage.checkFirstRowCheckbox();
        });

        await test.step("Verify: The hidden input of the element row is updated to 'checked' state", async () => {
            // Verify the hidden input of the element row is updated to 'checked' state
            await expect(pimPage.getFirstRowCheckboxInput()).toBeChecked();

            // Ensure the Master Checkbox remains checked
            await expect(pimPage.masterCheckboxInput).toBeChecked();
        });
    });

    /**
     * Test Case: Verify Master Checkbox functionality.
     * Assertion: Ensures clicking the table header's master checkbox selects all currently visible rows.
     */
    test("OrangeHRM_PIM_TC19_VerifyMasterCheckboxSelectsAll", async () => {
        await allure.story("UI Interaction - Master Checkbox Selection");
        await allure.severity("critical");
       
        await test.step("Action: Click the master checkbox located in the table header", async () => {
            // Click the master checkbox located in the table header
            await pimPage.masterCheckbox.click();
        });

        await test.step("Verify: Loop through and explicitly verify 100% of the visible rows are checked", async () => {
            // Retrieve all actual hidden input checkboxes for every visible row
            const allRowCheckboxInputs = await pimPage.getAllRowCheckboxInputs();

            // Loop through and explicitly verify 100% of the visible rows are checked
            for (const checkboxInput of allRowCheckboxInputs) {
                await expect(checkboxInput).toBeChecked();
            }
        });
    });

    /**
     * Test Case: Verify the visibility of the bulk 'Delete Selected' button.
     * Assertion: Ensures the destructive action button only appears when at least one row is explicitly selected.
     */
    test("OrangeHRM_PIM_TC20_VerifyBulkDeleteButtonVisibility", async () => {
        await allure.story("UI State - Contextual Action Buttons");
        await allure.severity("major");

        await test.step("Verify: Bulk delete button is completely hidden by default", async () => {
            await expect(pimPage.btnBulkDelete).toBeHidden();
        });

        await test.step("Action: Select the first employee row", async () => {
            await pimPage.checkFirstRowCheckbox();
        });

        await test.step("Verify: Bulk delete button dynamically appears", async () => {
            await expect(pimPage.btnBulkDelete).toBeVisible();
        });
    });

    /**
     * Test Case: Verify Pagination - Next Page navigation.
     * Assertion: Ensures clicking the 'Next' button loads a new set of records and updates the URL or table state.
     */
    test("OrangeHRM_PIM_TC21_VerifyPaginationNextPage", async () => {
        await allure.story("Table Pagination - Next Page Navigation");
        await allure.severity("major");
       
        let firstIdPage1: string;

        await test.step("Action: Record the first ID on Page 1", async () => {
            const isNextBtnVisible = await pimPage.btnNextPage.isVisible();
            test.skip(!isNextBtnVisible, 'Not enough records to trigger pagination');

            firstIdPage1 = await pimPage.getFirstRowIdText();
        });

        await test.step("Action: Navigate to Page 2", async () => {
            await pimPage.btnNextPage.click();
            await pimPage.waitForGlobalLoading();
        });

        await test.step("Verify: The records are different from Page 1", async () => {
            const firstIdPage2 = await pimPage.getFirstRowIdText();
            expect(firstIdPage1).not.toEqual(firstIdPage2);
        });
    });

    /**
     * Test Case: Verify Master Checkbox state across pagination.
     * Assertion: Ensures that selecting the master checkbox on Page 1 does NOT select rows on Page 2, and the master checkbox resets its state.
     */
    test("OrangeHRM_PIM_TC22_VerifyMasterCheckboxAcrossPagination", async () => {
        await allure.story("State Persistence - Checkbox Selection Across Pagination");
        await allure.severity("major");

        await test.step("Action: Check the master checkbox on Page 1", async () => {
            // Verify if the table has enough data to support pagination
            const isNextBtnVisible = await pimPage.btnNextPage.isVisible();

            // Skip this test if there is only one page
            test.skip(!isNextBtnVisible, 'Not enough records to test pagination behavior.');

            // Check the master checkbox on Page 1
            await pimPage.masterCheckbox.click();

            // Verify Page 1 master checkbox is successfully checked
            await expect(pimPage.masterCheckboxInput).toBeChecked();
        });

        await test.step("Action: Navigate to Page 2 and synchronize UI state", async () => {
            // Navigate to Page 2 and synchronize UI state
            await pimPage.btnNextPage.click();
            await pimPage.waitForGlobalLoading();
        });

        await test.step("Verify: On Page 2, the Master Checkbox MUST explicitly be UNCHECKED", async () => {
            // On Page 2, the Master Checkbox MUST explicitly be UNCHECKED
            await expect(pimPage.masterCheckboxInput).not.toBeChecked();

            // All employee rows on Page 2 MUST NOT carry over the checked state
            const allRowCheckboxInputs = await pimPage.getAllRowCheckboxInputs();
            for (const checkboxInput of allRowCheckboxInputs) {
                await expect(checkboxInput).not.toBeChecked();
            }
        });
    });

    /**
     * Test Case: Verify Browser Back and Forward navigation persistence.
     * Assertion: Ensures the user can navigate away using browser controls and return without crashing the DOM.
     */
    test("OrangeHRM_PIM_TC23_VerifyBrowserNavigationResilience", async ({ page }) => {
        await allure.story("Browser Navigation - Back/Forward State Persistence");
        await allure.severity("major");

        await test.step("Action: Navigate away from PIM back to Dashboard using browser 'back'", async () => {
            await page.goBack();
            await page.waitForLoadState('networkidle');
        });

        await test.step("Verify: System successfully returns to the Dashboard", async () => {
            await expect(page).toHaveURL(/.*dashboard/);
        });

        await test.step("Action: Navigate forward using browser 'forward' to return to the PIM", async () => {
            await page.goForward();
            await page.waitForLoadState('networkidle');
        });

        await test.step("Verify: System successfully returns to the PIM", async () => {
            await expect(page).toHaveURL(/.*viewEmployeeList/);
            await expect(pimPage.tableContainer).toBeVisible();
        });
    });

    /**
     * Test Case: Verify form state clearing upon hard page refresh (F5).
     * Assertion: Ensures that search parameters are cleared and default data is reloaded when the user manually reloads the page.
     */
    test("OrangeHRM_PIM_TC24_VerifyStateAfterPageRefresh", async ({page}) => {
        await allure.story("Browser Navigation - Form Reset on Hard Refresh");
        await allure.severity("minor");

        const testId = employeeData.searchEmployeeById.validEmployeeId;

        await test.step("Action: Input data into the search form without submitting", async () => {
            await pimPage.searchEmployee({ employeeId: testId }, false); 
        });

        await test.step("Action: Simulate user pressing F5 to reload the entire page", async () => {
            await page.reload();
            await pimPage.waitForGlobalLoading();
        });

        await test.step("Verify: Form is cleared and returns to default state", async () => {
            await pimPage.verifySearchFormState({ employeeId: '' });
        });
    });

    /**
     * Test Case: Verify that the Employee List data table displays all required column headers.
     * Assertion: Ensures the table structure is correct, containing the master checkbox, specific text columns, and the exact total column count.
     */
    test("OrangeHRM_PIM_TC25_VerifyRequiredTableHeaders", async () => {
        await allure.story("UI Structure - Data Table Headers Validation");
        await allure.severity("minor");

        await test.step("Verify: The data table contains all necessary column headers", async () => {
            // Verify master Checkbox in the Header (first column, no text)
            await expect(pimPage.masterCheckbox).toBeVisible();

            // Define the expected text for all other columns
            const expectedTextHeaders = [
                "Id", "First (& Middle) Name", "Last Name", "Job Title",
                "Employment Status", "Sub Unit", "Supervisor", "Actions"
            ];

            // Loop through the array and verify each header 
            for (const headerName of expectedTextHeaders) {
                // Escape special characters to prevent Regex errors and match the exact column header text
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
    });

    /**
     * Test Case: Verify the Top Menu UI Structure and Navigation logic.
     * Assertion: Leverages the Verification Keywords from PimTopMenuComponent to ensure all menus render correctly.
     */
    test("OrangeHRM_PIM_TC26_VerifyTopMenuStructure", async () => {
        await allure.story("UI Structure - Top Menu Navigation Bar");
        await allure.severity("minor");

        await test.step("Verify: All primary PIM menu tabs are visible to the Admin", async () => {
            await pimTopMenu.verifyPrimaryMenusVisible();
        });

        await test.step("Verify: The 'Employee List' tab is currently active and highlighted", async () => {
            await pimTopMenu.verifyTabIsActive('Employee List');
        });

        await test.step("Action: Click to expand the 'Configuration' dropdown", async () => {
            await pimTopMenu.openConfigurationDropdown();
        });

        await test.step("Verify: All sub-menus inside Configuration are visible", async () => {
            await pimTopMenu.verifyConfigurationSubMenusVisible();
        });
    });

    /**
     * Test Case: Verify the Configuration dropdown submenus explicitly.
     * Assertion: Ensures the dropdown expands correctly, displays all 5 required items, and verifies their exact text labels.
     */
    test("OrangeHRM_PIM_TC27_VerifyConfigurationSubMenusData", async () => {
        await allure.story("UI Structure - Configuration Submenus Verification");
        await allure.severity("minor");

        await test.step("Action: Click to expand the 'Configuration' dropdown", async () => {
            await pimTopMenu.openConfigurationDropdown();
        });

        await test.step("Verify: All 5 sub-menus are fully visible on the DOM", async () => {
            await pimTopMenu.verifyConfigurationSubMenusVisible();
        });

        await test.step("Verify: All sub-menus display the exact expected text labels", async () => {
            await pimTopMenu.verifyConfigurationSubMenuTexts();
        });
    }); 

    /**
     * Test Case: Verify visual hover effects on all Top Bar primary menu items.
     * Assertion: Ensures that hovering triggers a CSS background color change, dynamically verified via computed styles.
     * Edge Case Handled: Automatically skips the currently active tab since its hover color is persistently applied.
     */
    test("OrangeHRM_PIM_TC28_VerifyAllTopMenusHoverEffect", async () => {
        await allure.story("UI Interaction - Top Bar Menus Hover Effects");
        await allure.severity("low");

        const menusToTest: ('Configuration' | 'Employee List' | 'Add Employee' | 'Reports')[] = [
            'Configuration', 
            'Employee List', 
            'Add Employee', 
            'Reports'
        ];

        for (const menuName of menusToTest) {
            // Check if the current menu is already the active one (has the '--visited' class)
            const locator = pimTopMenu.getMenuLocator(menuName);
            const classList = await locator.getAttribute('class');
            const isActive = classList?.includes('--visited');

            // If the tab is currently active, hovering won't change its color visually. We elegantly skip it.
            if (isActive) {
                await test.step(`Skip: The '${menuName}' tab is currently active (already highlighted).`, async () => {
                    // Do nothing, just log the skip step in Allure Report
                });
                continue; // Move to the next menu in the loop
            }

            // Variable to store the baseline color before interaction
            let originalColor: string;

            await test.step(`Action: Capture baseline CSS and hover over the '${menuName}' tab`, async () => {
                // 1. Capture the initial background color BEFORE hovering (e.g., transparent/white)
                originalColor = await pimTopMenu.getMenuBackgroundColor(menuName);
                
                // 2. Perform the mouse hover action
                await pimTopMenu.hoverPrimaryMenu(menuName);
            });

            await test.step(`Verify: The '${menuName}' tab reflects a dynamic CSS color change`, async () => {
                // 3. Verify that the new color is different from the baseline color
                await pimTopMenu.verifyPrimaryMenuVisualHover(menuName, originalColor);
            });
        }
    });
});