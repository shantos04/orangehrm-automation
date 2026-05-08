/**
 * @fileoverview Test suite for the PIM (Personal Information Management) Add Employee module.
 * This file contains automated tests verifying the employee creation flow,
 * including form submissions and handling dynamic UI elements like Toast messages.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { LoginPage } from '../../app/pages/login.page';
import { AddEmployeePage } from '../../app/pages/pim/add-employee.page';
import { ToastComponent } from '../../app/components/common/toast.component';

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
    test.beforeEach(async ({ page }) => {
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
    test("OrangeHRM_PIM_ADD_TC01_AddEmployeeWithMandatoryFields", async ({ page }) => {
        const expectedSuccessText = expectedTexts.toastMessages.successSaved;

        await test.step("Action: Fill mandatory fields and submit the form", async () => {
            await addEmployeePage.add(employeeData.mandatoryFields);

            // Handle the race condition: capture the transient Toast message concurrently with the form submission
            await Promise.all([
                expect(toastComponent.toastMessage).toBeVisible(),
                addEmployeePage.btnSave.click()
            ]);
        });

        await test.step("Verify: System displays a successful creation toast message", async () => {
            // Validate the text content of the captured Toast message
            await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, {ignoreCase: true});
        });
    });

    /**
     * Test Case: Verify that a new employee can be created successfully when full details, including optional fields and a profile picture, are provided.
     * Assertion: Business Logic, File Upload functionality, and Transient UI validation (Toast message handling).
     */
    test("OrangeHRM_PIM_ADD_TC02_AddEmployeeWithFullDetails", async ({ page }) => {
        const { firstName, middleName, lastName, employeeId, profilePicturePath } = employeeData.fullDetails;
        const absoluteImagePath = path.resolve(profilePicturePath);
        const expectedSuccessText = expectedTexts.toastMessages.successSaved;

       await test.step("Action: Fill all fields, attach profile picture, and submit", async () => {
            await addEmployeePage.add({
                firstName,
                middleName,
                lastName,
                employeeId,
                profilePicture: absoluteImagePath
            });

            // Handle the race condition to catch the toast notification
            await Promise.all([
                expect(toastComponent.toastMessage).toBeVisible(),
                addEmployeePage.btnSave.click()
            ]);
       });

       await test.step("Verify: System displays a successful creation toast message", async () => {
            await expect(toastComponent.toastMessage).toContainText(expectedSuccessText);
       });
    });

    /**
     * Test Case: Verify that validation errors are displayed when mandatory fields (First Name, Last Name) are left empty.
     * Assertion: Form Validation - Verifying the visibility and exact text content of 'Required' error messages upon submission.
     */
    test("OrangeHRM_PIM_ADD_TC03_VerifyRequiredFieldValidation", async ({ page }) => {
        await test.step("Action: Click 'Save' button without filling any fields", async () => {
            await addEmployeePage.btnSave.click();
        });

        await test.step("Verify: 'Required' error messages appear under mandatory fields", async () => {
            // Utilize the verification keyword from the POM to assert UI state
            await addEmployeePage.verifyRequiredFieldErrors({
                firstName: true,
                lastName: true
            });
        });
    });

    /**
     * Test Case: Verify that the system prevents creating an employee with an existing Employee ID.
     * Assertion: Business Logic - Validates unique constraint handling on the Employee ID field.
     */
    test("OrangeHRM_PIM_ADD_TC04_VerifyDuplicateEmployeeIdError", async ({ page }) => {
        const expectedDuplicateText = expectedTexts.validationMessages.duplicateEmployeeId;

        await test.step("Action: Fill form with an already existing Employee ID and submit", async () => {
            await addEmployeePage.add(employeeData.duplicateIdScenario);
            await addEmployeePage.btnSave.click();
        });

        await test.step("Verify: System displays a duplicate ID error message", async () => {
            await expect(addEmployeePage.msgEmployeeIdError).toBeVisible();
            await expect(addEmployeePage.msgEmployeeIdError).toHaveText(expectedDuplicateText);
        });
    });

    /**
     * Test Case: Verify that the 'Cancel' button correctly discards input and redirects to the Employee List.
     * Assertion: Page Routing - Ensures the application navigates back to the correct URL.
     */
    test("OrangeHRM_PIM_ADD_TC05_VerifyCancelAddEmployee", async ({ page }) => {
        const expectedEmployeeListUrl = expectedTexts.urls.employeeList;

        await test.step("Action: Click the 'Cancel' button on the form", async () => {
            await addEmployeePage.btnCancel.click();
        });

        await test.step("Verify: Application redirects back to the Employee List Page", async () => {
            await expect(page).toHaveURL(new RegExp(expectedEmployeeListUrl));
        });
    });

    /**
     * Test Case: Verify successful employee creation with login credentials enabled.
     * Assertion: End-to-End Flow - Validates data persistence and success Toast message feedback.
     */
    test("OrangeHRM_PIM_ADD_TC06_AddEmployeeWithLoginDetails", async ({ page }) => {
        const expectedSuccessText = expectedTexts.toastMessages.successSaved;

        await test.step("Action: Enable and fill login details, then submit", async () => {
            await addEmployeePage.add(employeeData.loginDetailsSuccess);

            await Promise.all([
                expect(toastComponent.toastMessage).toBeVisible(),
                addEmployeePage.btnSave.click()
            ]);
        });

        await test.step("Verify: System displays a successful creation toast message", async () => {
            await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, { ignoreCase: true });  
        });
    });

    /**
     * Test Case: Verify that a validation error is displayed when Password and Confirm Password do not match.
     * Assertion: Form Validation - Ensures data integrity for password confirmation.
     */
    test("OrangeHRM_PIM_ADD_TC07_VerifyPasswordMismatchError", async ({ page }) => {
        const expectedErrorText = expectedTexts.validationMessages.passwordMismatch;

        await test.step("Action: Enter mismatched passwords and submit", async () => {
            await addEmployeePage.add(employeeData.loginDetailsMismatch);
            await addEmployeePage.btnSave.click();
        });

        await test.step("Verify: Confirm Password field displays a mismatch error", async () => {
            await addEmployeePage.verifyLoginDetailsErrors({
                confirmPassword: expectedErrorText
            });
        });
    });

    /**
     * Test Case: Verify validation for the minimum character length of Username and Password.
     * Assertion: Data Constraint - Ensures fields reject inputs below the required length threshold.
     */
    test("OrangeHRM_PIM_ADD_TC08_VerifyLoginDetailsMinLengthValidation", async ({ page }) => {
        const expectedUsernameError = expectedTexts.validationMessages.usernameMinLength;
        const expectedPasswordError = expectedTexts.validationMessages.passwordMinLength;

        await test.step("Action: Input credentials that are below the minimum length requirement", async () => {
            await addEmployeePage.add(employeeData.loginDetailsShort);
        });

        await test.step("Verify: Real-time validation errors appear for Username and Password limits", async () => {
            await addEmployeePage.verifyLoginDetailsErrors({
                username: expectedUsernameError,
                password: expectedPasswordError
            });
        });
    });

    /**
     * Test Case: Verify validation for the maximum character length of Username and Password.
     * Assertion: Data Constraint - Ensures fields reject inputs exceeding the character limit (User: 40, Pass: 64).
     */
    test("OrangeHRM_PIM_ADD_TC09_VerifyLoginDetailsMaxLengthValidation", async ({ page }) => {
        const expectedUsernameError = expectedTexts.validationMessages.usernameMaxLength;
        const expectedPasswordError = expectedTexts.validationMessages.passwordMaxLength;

        await test.step("Action: Input credentials that exceed tha maximum length limit", async () => {
            await addEmployeePage.add(employeeData.loginDetailsMaxLength);
        })

        await test.step("Verify: Real-time validation errors appear for exceeding character limits", async () => {
            await addEmployeePage.verifyLoginDetailsErrors({
                username: expectedUsernameError,
                password: expectedPasswordError
            })
        })
    });

    test("OrangeHRM_PIM_ADD_TC10_VerifyPasswordNumberRequirementValidation", async ({ page }) => {
        const expectedPasswordError = expectedTexts.validationMessages.passwordNoNumber;

        await test.step("Action: Input a password string without any numerical characters", async () => {
            await addEmployeePage.add(employeeData.loginDetailsNoNumber);
        });

        await test.step("Verify: Real-time validation error prompts for a number requirement", async () => {
            await addEmployeePage.verifyLoginDetailsErrors({
                password: expectedPasswordError
            });
        });
    });
})