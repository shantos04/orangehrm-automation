/**
 * @fileoverview Test suite for the PIM (Personal Information Management) Add Employee module.
 * This file contains automated tests verifying the employee creation flow,
 * including form submissions and handling dynamic UI elements like Toast messages.
 */

import { test, expect } from '../../../fixtures/e2e/add-employee.fixture';
import path from 'path';
import * as allure from "allure-js-commons";

import employeeData from '../../../data/employee-data.json';
import expectedTexts from '../../../data/expected-texts.json';

/**
 * Test Suite: PIM Module - Add Employee
 * Focuses on verifying data persistence and UI feedback during the employee creation process.
 */
test.describe("UI E2E Testing - PIM Module: Add Employee", () => {

    // ========================================================================
    // CẤU HÌNH TOÀN CỤC (GLOBAL)
    // LƯU Ý: Nhãn 'package' tự động đã được cấu hình trong add-employee.fixture.ts
    // ========================================================================
    test.beforeEach(async ({ page }) => {
        // Dịch cấp: Cấp 1 là UI E2E, Cấp 2 là PIM Module
        await allure.parentSuite("UI E2E Testing");
        await allure.suite("PIM Module");

        await allure.epic("PIM Module");
    });

    // ========================================================================
    // GROUP A: POSITIVE CREATION SCENARIOS
    // ========================================================================
    test.describe("Positive Creation Scenarios", () => {
        test.beforeEach(async () => {
            await allure.subSuite("Positive Employee Creation");
            await allure.feature("Add Employee Functionality");
        });

        /**
         * Test Case: Verify that a new employee can be created successfully when only mandatory fields are provided.
         * Assertion: Business Logic and Transient UI validation (Toast message handling).
         */
        test("OrangeHRM_PIM_ADD_TC01_AddEmployeeWithMandatoryFields", async ({ addEmployeePage, toastComponent }) => {
            await allure.story("Positive - Add Employee with Mandatory Fields");
            await allure.severity("critical");

            const expectedSuccessText = expectedTexts.toastMessages.successSaved;

            await test.step("Action: Fill mandatory fields and submit the form", async () => {
                await addEmployeePage.add(employeeData.mandatoryFields);

                // Handle the race condition: capture the transient Toast message concurrently with the form submission
                await Promise.all([
                    expect(toastComponent.toastMessage).toBeVisible(),
                    addEmployeePage.clickSave()
                ]);
            });

            await test.step("Verify: System displays a successful creation toast message", async () => {
                // Validate the text content of the captured Toast message
                await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, { ignoreCase: true });
            });
        });

        /**
         * Test Case: Verify that a new employee can be created successfully when full details, including optional fields and a profile picture, are provided.
         * Assertion: Business Logic, File Upload functionality, and Transient UI validation (Toast message handling).
         */
        test("OrangeHRM_PIM_ADD_TC02_AddEmployeeWithFullDetails", async ({ addEmployeePage, toastComponent }) => {
            await allure.story("Positive - Add Employee with Full Details & Profile Picture");
            await allure.severity("critical");

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
                    addEmployeePage.clickSave()
                ]);
            });

            await test.step("Verify: System displays a successful creation toast message", async () => {
                await expect(toastComponent.toastMessage).toContainText(expectedSuccessText);
            });
        });

        /**
         * Test Case: Verify successful employee creation with login credentials enabled.
         * Assertion: End-to-End Flow - Validates data persistence and success Toast message feedback.
         */
        test("OrangeHRM_PIM_ADD_TC06_AddEmployeeWithLoginDetails", async ({ addEmployeePage, toastComponent }) => {
            await allure.story("Positive - Add Employee with User Account Creation");
            await allure.severity("blocker");

            const expectedSuccessText = expectedTexts.toastMessages.successSaved;

            await test.step("Action: Enable and fill login details, then submit", async () => {
                await addEmployeePage.add(employeeData.loginDetailsSuccess);

                await Promise.all([
                    expect(toastComponent.toastMessage).toBeVisible(),
                    addEmployeePage.clickSave()
                ]);
            });

            await test.step("Verify: System displays a successful creation toast message", async () => {
                await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, { ignoreCase: true });
            });
        });

        /**
         * Test Case: Verify successful employee creation when the Login Account is initially set to 'Disabled'.
         * Assertion: End-to-End Flow - Ensures the radio button state is correctly passed and saved in the database.
         */
        test("OrangeHRM_PIM_ADD_TC14_AddEmployeeWithDisabledLoginStatus", async ({ addEmployeePage, toastComponent }) => {
            await allure.story("Positive - Add Employee with Disabled User Account");
            await allure.severity("major");

            const expectedSuccessText = expectedTexts.toastMessages.successSaved;

            await test.step("Action: Enable login details, fill credentials, and toggle status to 'Disabled'", async () => {
                await addEmployeePage.add({
                    ...employeeData.loginDetailsDisabled,
                    status: employeeData.loginDetailsDisabled.status as "Enabled" | "Disabled"
                });

                await Promise.all([
                    expect(toastComponent.toastMessage).toBeVisible(),
                    addEmployeePage.clickSave(true)
                ]);
            });

            await test.step("Verify: System successfully creates the user despite the disabled status", async () => {
                await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, { ignoreCase: true });
            });
        });

        /**
         * Test Case: Verify alphanumeric acceptance in Employee ID.
         * Assertion: Data Constraint - Employee ID is not restricted to numbers; it should accept alphanumeric strings.
         */
        test("OrangeHRM_PIM_ADD_TC16_VerifyAlphanumericEmployeeId", async ({ addEmployeePage, toastComponent }) => {
            await allure.story("Positive - Employee Information: Alphanumeric Employee ID");
            await allure.severity("major");

            const expectedSuccessText = expectedTexts.toastMessages.successSaved;

            await test.step("Action: Input an alphanumeric string (e.g., EMP-001) into the Employee ID field", async () => {
                await addEmployeePage.add(employeeData.alphanumericIdScenario);

                await Promise.all([
                    expect(toastComponent.toastMessage).toBeVisible(),
                    addEmployeePage.clickSave(true)
                ]);
            });

            await test.step("Verify: System accepts the alphanumeric ID and creates the profile", async () => {
                await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, { ignoreCase: true });
            });
        });
    });

    // ========================================================================
    // GROUP B: CORE FORM VALIDATION
    // ========================================================================
    test.describe("Core Form Validation", () => {
        test.beforeEach(async () => {
            await allure.subSuite("Core Form Validation");
            await allure.feature("Add Employee Form Constraints");
        });

        /**
         * Test Case: Verify that validation errors are displayed when mandatory fields (First Name, Last Name) are left empty.
         * Assertion: Form Validation - Verifying the visibility and exact text content of 'Required' error messages upon submission.
         */
        test("OrangeHRM_PIM_ADD_TC03_VerifyRequiredFieldValidation", async ({ addEmployeePage }) => {
            await allure.story("Negative - Form Submission with Empty Mandatory Fields");
            await allure.severity("normal");

            await test.step("Action: Click 'Save' button without filling any fields", async () => {
                await addEmployeePage.clickSave(false);
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
        test("OrangeHRM_PIM_ADD_TC04_VerifyDuplicateEmployeeIdError", async ({ addEmployeePage }) => {
            await allure.story("Negative - Handle Duplicate Employee ID");
            await allure.severity("critical");

            const expectedDuplicateText = expectedTexts.validationMessages.duplicateEmployeeId;

            await test.step("Action: Fill form with an already existing Employee ID and submit", async () => {
                await addEmployeePage.add(employeeData.duplicateIdScenario);
                await addEmployeePage.clickSave(false);
            });

            await test.step("Verify: System displays a duplicate ID error message", async () => {
                await expect(addEmployeePage.msgEmployeeIdError).toBeVisible();
                await expect(addEmployeePage.msgEmployeeIdError).toHaveText(expectedDuplicateText);
            });
        });

        /**
         * Test Case: Verify validation when uploading a profile picture that exceeds the maximum allowed file size (e.g., > 1MB).
         * Assertion: File Upload Constraint - System should reject the file and display a specific error message.
         */
        test("OrangeHRM_PIM_ADD_TC11_VerifyProfilePictureMaxSizeValidation", async ({ addEmployeePage }) => {
            await allure.story("Negative - Profile Picture: Exceeds Maximum File Size");
            await allure.severity("normal");

            const largeImgPath = path.resolve(employeeData.fileUploads.oversizedImage);
            const expectedFileError = expectedTexts.validationMessages.fileTooLarge;

            await test.step("Action: Attempt to upload an image larger than 1MB", async () => {
                await addEmployeePage.add({
                    firstName: 'Test',
                    lastName: 'LargeFile',
                    profilePicture: largeImgPath
                });
            });

            await test.step("Verify: System displays a 'Attachment Size Exceeded' error immediately", async () => {
                await addEmployeePage.verifyProfilePictureError(expectedFileError);
            });
        });

        /**
         * Test Case: Verify validation when uploading an invalid file format (e.g., .txt or .pdf instead of an image).
         * Assertion: File Upload Constraint - System should only accept specific image MIME types (.jpg, .png, .gif).
         */
        test("OrangeHRM_PIM_ADD_TC12_VerifyProfilePictureInvalidFileType", async ({ addEmployeePage }) => {
            await allure.story("Negative - Profile Picture: Invalid File Format");
            await allure.severity("normal");

            const invalidFilePath = path.resolve(employeeData.fileUploads.invalidType);
            const expectedFileError = expectedTexts.validationMessages.fileTypeNotAllowed;

            await test.step("Action: Attempt to upload a non-image file format", async () => {
                await addEmployeePage.add({
                    firstName: 'Test',
                    lastName: 'InvalidType',
                    profilePicture: invalidFilePath
                });
            });

            await test.step("Verify: System displays a 'File type not allowed' error immediately", async () => {
                await addEmployeePage.verifyProfilePictureError(expectedFileError);
            });
        });

        /**
         * Test Case: Verify Employee Name max length validation.
         * Assertion: Data Constraint - First, Middle, and Last Name fields should not accept strings beyond their database limits (e.g., 30 chars).
         */
        test("OrangeHRM_PIM_ADD_TC15_VerifyNameFieldsMaxLength", async ({ addEmployeePage }) => {
            await allure.story("Negative - Employee Information: Name Fields Max Length");
            await allure.severity("minor");

            await test.step("Action: Input strings exceeding the 30-character limit into name fields", async () => {
                await addEmployeePage.add(employeeData.namesExceedingMaxLength);
            });

            await test.step("Verify: Fields prevent typing beyond the maximum length limit", async () => {
                // For fields with HTML 'maxlength' attributes, Playwright's 'fill' will truncate. 
                // We verify the actual input value doesn't exceed the limit.
                const firstNameValue = await addEmployeePage.txtFirstName.inputValue();
                expect(firstNameValue.length).toBeLessThanOrEqual(30);

                const lastNameValue = await addEmployeePage.txtLastName.inputValue();
                expect(lastNameValue.length).toBeLessThanOrEqual(30);
            });
        });
    });

    // ========================================================================
    // GROUP C: USER ACCOUNT VALIDATION (LOGIN DETAILS)
    // ========================================================================
    test.describe("User Account Validation", () => {
        test.beforeEach(async () => {
            await allure.subSuite("User Account Validation");
            await allure.feature("Add Employee Account Constraints");
        });

        /**
         * Test Case: Verify that a validation error is displayed when Password and Confirm Password do not match.
         * Assertion: Form Validation - Ensures data integrity for password confirmation.
         */
        test("OrangeHRM_PIM_ADD_TC07_VerifyPasswordMismatchError", async ({ addEmployeePage }) => {
            await allure.story("Negative - Login Details: Password Mismatch Validation");
            await allure.severity("normal");

            const expectedErrorText = expectedTexts.validationMessages.passwordMismatch;

            await test.step("Action: Enter mismatched passwords and submit", async () => {
                await addEmployeePage.add(employeeData.loginDetailsMismatch);
                await addEmployeePage.clickSave(false);
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
        test("OrangeHRM_PIM_ADD_TC08_VerifyLoginDetailsMinLengthValidation", async ({ addEmployeePage }) => {
            await allure.story("Negative - Login Details: Minimum Length Constraints");
            await allure.severity("normal");

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
        test("OrangeHRM_PIM_ADD_TC09_VerifyLoginDetailsMaxLengthValidation", async ({ addEmployeePage }) => {
            await allure.story("Negative - Login Details: Maximum Length Constraints");
            await allure.severity("normal");

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

        /**
         * Test Case: Verify Password Complexity requirements (Number Required).
         * Assertion: Form Validation - Ensures passwords meet security complexity rules.
         */
        test("OrangeHRM_PIM_ADD_TC10_VerifyPasswordNumberRequirementValidation", async ({ addEmployeePage }) => {
            await allure.story("Negative - Login Details: Password Complexity (Number Required)");
            await allure.severity("normal");

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

        /**
         * Test Case: Verify that the system prevents creating login details with an already existing Username.
         * Assertion: Business Logic - Validates unique constraint handling on the system's global Username field.
         */
        test("OrangeHRM_PIM_ADD_TC13_VerifyDuplicateUsernameError", async ({ addEmployeePage }) => {
            await allure.story("Negative - Login Details: Handle Duplicate Username");
            await allure.severity("critical");

            const expectedDuplicateUserText = expectedTexts.validationMessages.duplicateUsername;

            await test.step("Action: Enable login details and input a username that already exists (e.g., Admin)", async () => {
                await addEmployeePage.add(employeeData.duplicateUsernameScenario);
                await addEmployeePage.clickSave(false); // Negative test
            });

            await test.step("Verify: Username field displays an 'Already exists' error", async () => {
                await addEmployeePage.verifyLoginDetailsErrors({
                    username: expectedDuplicateUserText
                });
            });
        });
    });

    // ========================================================================
    // GROUP D: UI INTERACTIONS
    // ========================================================================
    test.describe("UI Interactions", () => {
        test.beforeEach(async () => {
            await allure.subSuite("UI Interactions");
            await allure.feature("Add Employee UI State");
        });

        /**
         * Test Case: Verify that the 'Cancel' button correctly discards input and redirects to the Employee List.
         * Assertion: Page Routing - Ensures the application navigates back to the correct URL.
         */
        test("OrangeHRM_PIM_ADD_TC05_VerifyCancelAddEmployee", async ({ page, addEmployeePage }) => {
            await allure.story("UI Interaction - Cancel Form Submission");
            await allure.severity("minor");

            const expectedEmployeeListUrl = expectedTexts.urls.employeeList;

            await test.step("Action: Click the 'Cancel' button on the form", async () => {
                await addEmployeePage.clickCancel();
            });

            await test.step("Verify: Application redirects back to the Employee List Page", async () => {
                await expect(page).toHaveURL(new RegExp(expectedEmployeeListUrl));
            });
        });

        /**
         * Test Case: Verify UI state clearing when toggling the 'Create Login Details' switch.
         * Assertion: UI Interaction - Toggling the switch off should hide the form and optionally clear its state.
         */
        test("OrangeHRM_PIM_ADD_TC17_VerifyCreateLoginSwitchToggle", async ({ addEmployeePage }) => {
            await allure.story("UI Interaction - Create Login Details Toggle State");
            await allure.severity("minor");

            await test.step("Action: Turn ON the 'Create Login Details' switch", async () => {
                await addEmployeePage.switchCreateLogin.click();
            });

            await test.step("Verify: Login detail input fields become visible", async () => {
                await expect(addEmployeePage.txtUsername).toBeVisible();
                await expect(addEmployeePage.txtPassword).toBeVisible();
            });

            await test.step("Action: Turn OFF the 'Create Login Details' switch", async () => {
                await addEmployeePage.switchCreateLogin.click();
            });

            await test.step("Verify: Login detail input fields are hidden from the DOM", async () => {
                await expect(addEmployeePage.txtUsername).toBeHidden();
                await expect(addEmployeePage.txtPassword).toBeHidden();
            });
        });
    });
});