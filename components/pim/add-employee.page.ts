/**
 * @fileoverview Page Object Model (POM) for the Add Employee page in the OrangeHRM application.
 * This file encapsulates the locators and actions required to interact with the Add Employee form,
 * promoting code reusability and easier maintenance for automation tests.
 */

import {Page, Locator} from '@playwright/test';

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
        this.txtEmployeeId = page.locator('.oxd-input-group').filter({hasText: 'Employee Id'}).locator('.oxd-input');   //page.locator('//label[text()="Employee Id"]/ancestor::div[contains(@class, "oxd-input-group")]//input');
        this.fileInputPicture = page.locator('input[type="file"]');

        // --- Initialize Wrapper Blocks ---
        this.firstNameBlock = page.locator('.oxd-input-group').filter({has: page.getByPlaceholder('First Name')});
        this.lastNameBlock = page.locator('.oxd-input-group').filter({has: page.getByPlaceholder('Last Name')});
        
        // --- Initialize Validation Messages scoped within Blocks ---
        this.msgFirstNameRequired = this.firstNameBlock.locator('.oxd-input-field-error-message');
        this.msgLastNameRequired = this.lastNameBlock.locator('.oxd-input-field-error-message');
   
        // --- Initialize Buttons ---
        this.btnSave = page.getByRole('button', {name: 'Save'});
        this.btnCancel = page.getByRole('button', {name: 'Cancel'});
    }
    
    /**
     * Fills out the employee details form.
     * @param employeeData - The object containing the employee's information.
     * @param employeeData.firstName - The first name of the employee. Optional.
     * @param employeeData.middleName - The middle name of the employee. Optional.
     * @param employeeData.lastName - The last name of the employee. Optional.
     * @param employeeData.employeeId - A custom employee ID to override the auto-generated one. Optional.
     * @param employeeData.profilePicture - The absolute file path to the profile picture image. Optional.
     */
    async add(employeeData: { firstName?: string, middleName?: string, lastName?: string, employeeId?: string, profilePicture?: string}) {
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
    }
}