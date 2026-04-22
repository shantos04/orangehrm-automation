/**
 * @fileoverview Test suite for the PIM (Personal Information Management) Add Employee module.
 * This file contains automated tests verifying the employee creation flow,
 * including form submissions and handling dynamic UI elements like Toast messages.
 */

import {test, expect} from '@playwright/test';
import path from 'path';
import {LoginPage} from '../../pages/login.page';
import {AddEmployeePage} from '../../components/pim/add-employee.page';
import {ToastComponent} from '../../components/common/toast.component';

import usersData from '../../data/users.json';
import employeeData from '../../data/employee-data.json';
import expectedTexts from '../../data/expected-texts.json';

/**
 * Test Suite: PIM Module - Add Employee
 * Focuses on verifying data persistence and UI feedback during the employee creation process.
 */
test.describe("PIM Module - Add Employee", () => {

    let loginPage: LoginPage;
    let addEmployeePage: AddEmployeePage;
    let toastComponent: ToastComponent;

    /**
     * Setup: Initializes page objects, authenticates the user,
     * and routes directly to the Add Employee URL to optimize test execution time.
     */
    test.beforeEach(async ({page}) => {
        // Increase the default timeout to 60 seconds to prevent flaky failures on slow environments
        test.setTimeout(60000);

        // Initialize POM instances
        loginPage = new LoginPage(page);
        addEmployeePage = new AddEmployeePage(page);
        toastComponent = new ToastComponent(page);

        // Pre-condition: Authenticate via the Login page
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);
        
        // Direct navigation to the target module to save execution time (bypassing sidebar clicks)
        await page.goto('/web/index.php/pim/addEmployee');
    });

    /**
     * Test Case: Verify that a new employee can be created successfully when only mandatory fields are provided.
     * Assertion: Business Logic and Transient UI validation (Toast message handling).
     */
    test("OrangeHRM_PIM_TC01_AddEmployeeWithMandatoryFields", async({page}) => {
        const expectedSuccessText = expectedTexts.toastMessages.successSaved;

        // Fill the input fields in the Add Employee form
        await addEmployeePage.add(employeeData.mandatoryFields);

        // Handle the race condition using Promise.all
        // This ensures the framework captures the transient Toast message concurrently with the form submission
        await Promise.all([
            // Continuously checks the DOM for the visibility of the toast container
            expect(toastComponent.toastMessage).toBeVisible(),
        
            // Clicks the save button to submit the form and trigger the toast
            addEmployeePage.btnSave.click()
        ]);

        // Validate the text content of the captured Toast message
        await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, {ignoreCase: true});
    });

    /**
     * Test Case: Verify that a new employee can be created successfully when full details, including optional fields and a profile picture, are provided.
     * Assertion: Business Logic, File Upload functionality, and Transient UI validation (Toast message handling).
     */
    test("OrangeHRM_PIM_TC02_AddEmployeeWithFullDetails", async({page}) => {
        const { firstName, middleName, lastName, employeeId, profilePicturePath } = employeeData.fullDetails;
        const absoluteImagePath = path.resolve(profilePicturePath);
        const expectedSuccessText = expectedTexts.toastMessages.successSaved;

        // Fill the input fields and attach the profile picture
        await addEmployeePage.add({
            firstName,
            middleName,
            lastName,
            employeeId,
            profilePicture: absoluteImagePath 
        });

        // Handle the race condition using Promise.all
        // This ensures the framework captures the transient Toast message concurrently with the form submission
        await Promise.all([
            // Continuously checks the DOM for the visibility of the toast container
            expect(toastComponent.toastMessage).toBeVisible(),
        
            // Clicks the save button to submit the form and trigger the toast
            addEmployeePage.btnSave.click()
        ]);

        // Validate the text content of the captured Toast message
        await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, {ignoreCase: true});
    });

    /**
     * Test Case: Verify that validation errors are displayed when mandatory fields (First Name, Last Name) are left empty.
     * Assertion: Form Validation - Verifying the visibility and exact text content of 'Required' error messages upon submission.
     */
    test("OrangeHRM_PIM_TC03_VerifyRequiredFieldValidation", async({page}) => {
        const expectedRequiredText = expectedTexts.validationMessages.required;

        await addEmployeePage.btnSave.click();

        await expect(addEmployeePage.msgFirstNameRequired).toBeVisible();
        await expect(addEmployeePage.msgLastNameRequired).toBeVisible();

        await expect(addEmployeePage.msgFirstNameRequired).toHaveText(expectedRequiredText);
        await expect(addEmployeePage.msgLastNameRequired).toHaveText(expectedRequiredText);
    });

    test("OrangeHRM_PIM_TC04_VerifyDuplicateEmployeeIdError", async({page}) => {
        const expectedDuplicateText = expectedTexts.validationMessages.duplicateEmployeeId;

        await addEmployeePage.add(employeeData.duplicateIdScenario);

        await expect(addEmployeePage.msgEmployeeIdError).toBeVisible();
        await expect(addEmployeePage.msgEmployeeIdError).toHaveText(expectedDuplicateText);
    });
})