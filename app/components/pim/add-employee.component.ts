/**
 * @fileoverview Page Object Model (POM) for the Add Employee page in the OrangeHRM application.
 * This file encapsulates the locators and actions required to interact with the Add Employee form,
 * promoting code reusability and easier maintenance for automation tests.
 */

import { Page, Locator } from '@playwright/test';

/**
 * Represents the Add Employee Page.
 */
export class AddEmployeePage {
    /** The Playwright Page instance representing the current browser tab. */
    readonly page: Page;

    // --- Locators for Employee Information Fields ---

    /** Locator for the First Name input field. */
    readonly txtFirstName: Locator;

    /** Locator for the Middle Name input field. */
    readonly txtMiddleName: Locator;

    /** Locator for the Last Name input field. */
    readonly txtLastName: Locator;

    /** * Locator for the Employee ID input field.
     * Uses a chained locator strategy: finds the parent wrapper containing the 'Employee Id' label, 
     * then scopes down to the input field inside it to avoid strict mode violations.
     */
    readonly txtEmployeeId: Locator;
    readonly msgEmployeeIdError: Locator;

    /** * Locator for the hidden file input element used to upload the employee's profile picture. 
     * Targets the actual <input type="file"> rather than the UI button for stable uploads.
     */
    readonly fileInputPicture: Locator;

    // --- Locators for Wrapper Blocks & Validation ---

    /** Locator for the wrapper group containing the First Name input.  */
    readonly firstNameBlock: Locator;

    /** Locator for the wrapper group containing the Last Name input.  */
    readonly lastNameBlock: Locator;

    /** Locator for the 'Required' error message specifically under the First Name field. */
    readonly msgFirstNameRequired: Locator;

    /** Locator for the 'Required' error message specifically under the Last Name field. */
    readonly msgLastNameRequired: Locator;

    // --- Locators cho Create Login Details ---

    readonly switchCreateLogin: Locator;
    readonly txtUsername: Locator;
    readonly txtPassword: Locator;
    readonly txtConfirmPassword: Locator;
    readonly statusEnabled: Locator;
    readonly statusDisabled: Locator;

    // --- Validation Messages cho Login Details ---

    readonly msgUsernameError: Locator;
    readonly msgPasswordError: Locator;
    readonly msgConfirmPasswordError: Locator;

    // --- Locators for Action Buttons ---

    /** Locator for the Save button. */
    readonly btnSave: Locator;

    /** Locator for the Cancel button. */
    readonly btnCancel: Locator;

    /**
     * Initializes the locators for the Add Employee page.
     * @param page - The Playwright Page instance passed from the test runner.
     */
    constructor(page: Page) {
        this.page = page;

        // --- Initialize Input Fields ---
        this.txtFirstName = page.getByPlaceholder('First Name');
        this.txtMiddleName = page.getByPlaceholder('Middle Name');
        this.txtLastName = page.getByPlaceholder('Last Name');
        this.txtEmployeeId = page.locator('.oxd-input-group').filter({ hasText: 'Employee Id' }).locator('.oxd-input');   //page.locator('//label[text()="Employee Id"]/ancestor::div[contains(@class, "oxd-input-group")]//input');
        this.fileInputPicture = page.locator('input[type="file"]');

        // --- Toggle switch ---
        this.switchCreateLogin = page.locator('.oxd-switch-input');

        // --- Initialize Input fields for Create Login Details ---
        this.txtUsername = page.locator('.oxd-input-group').filter({ hasText: 'Username' }).locator('.oxd-input');
        this.txtPassword = page.locator('.oxd-input-group').filter({ hasText: 'Password' }).first().locator('.oxd-input');
        this.txtConfirmPassword = page.locator('.oxd-input-group').filter({ hasText: 'Confirm Password' }).locator('.oxd-input');

        // --- Status Radio buttons ---
        this.statusEnabled = page.getByRole('radio', { name: 'Enabled' });
        this.statusDisabled = page.getByRole('radio', { name: 'Disabled' });

        // --- Initialize Wrapper Blocks ---
        this.firstNameBlock = page.locator('.oxd-input-group').filter({ has: page.getByPlaceholder('First Name') }).last();
        this.lastNameBlock = page.locator('.oxd-input-group').filter({ has: page.getByPlaceholder('Last Name') }).last();

        // --- Initialize Validation Messages scoped within Blocks ---
        this.msgFirstNameRequired = this.firstNameBlock.locator('.oxd-input-field-error-message');
        this.msgLastNameRequired = this.lastNameBlock.locator('.oxd-input-field-error-message');
        this.msgEmployeeIdError = page.locator('.oxd-input-group').filter({ hasText: 'Employee Id' }).locator('.oxd-input-field-error-message');
        this.msgUsernameError = page.locator('.oxd-input-group').filter({ hasText: 'Username' }).locator('.oxd-input-field-error-message');
        this.msgPasswordError = page.locator('.oxd-input-group').filter({ hasText: 'Password' }).first().locator('.oxd-input-field-error-message');
        this.msgConfirmPasswordError = page.locator('.oxd-input-group').filter({ hasText: 'Confirm Password' }).locator('.oxd-input-field-error-message');

        // --- Initialize Buttons ---
        this.btnSave = page.getByRole('button', { name: 'Save' });
        this.btnCancel = page.getByRole('button', { name: 'Cancel' });
    }

    /**
     * Fills out the employee details form, with an option to create login credentials.
     * * @param employeeData - The object containing the employee's information.
     * @param employeeData.firstName - The first name of the employee. Optional.
     * @param employeeData.middleName - The middle name of the employee. Optional.
     * @param employeeData.lastName - The last name of the employee. Optional.
     * @param employeeData.employeeId - A custom employee ID to override the auto-generated one. Optional.
     * @param employeeData.profilePicture - The absolute file path to the profile picture image. Optional.
     * @param employeeData.createLoginDetails - Flag to toggle the "Create Login Details" section. Defaults to false.
     * @param employeeData.username - The username for the new account. 
     * @param employeeData.password - The password for the new account. 
     * @param employeeData.confirmPassword - The password confirmation to validate against the password.
     * @param employeeData.status - The initial status of the account ('Enabled' or 'Disabled').
     */
    async add(employeeData: {
        firstName?: string,
        middleName?: string,
        lastName?: string, employeeId?:
        string,
        profilePicture?: string,
        createLoginDetails?: boolean,
        username?: string,
        password?: string,
        confirmPassword?: string,
        status?: 'Enable' | 'Disabled'
    }) {
        // Default to empty strings if properties are not provided
        await this.txtFirstName.fill(employeeData.firstName || '');
        await this.txtMiddleName.fill(employeeData.middleName || '');
        await this.txtLastName.fill(employeeData.lastName || '');

        // If a custom employeeId is provided, fill it. Otherwise, leave it as is (auto-generated).
        if (employeeData.employeeId) {
            await this.txtEmployeeId.fill(employeeData.employeeId);
        }

        // Upload picture if a path is provided
        if (employeeData.profilePicture) {
            await this.fileInputPicture.setInputFiles(employeeData.profilePicture);
        }

        // Extract the flag with a default fallback to false
        const isCreateLogin = employeeData.createLoginDetails ?? false;

        if (isCreateLogin) {
            await this.switchCreateLogin.click();

            await this.txtUsername.fill(employeeData.username || '');
            await this.txtPassword.fill(employeeData.password || '');
            await this.txtConfirmPassword.fill(employeeData.confirmPassword || '');

            if (employeeData.status === 'Disabled') {
                await this.statusDisabled.click({ force: true });
            }
        }
    }
}