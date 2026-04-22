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

    // --- Locators for Action Buttons ---

    /** Locator for the Save button. */
    readonly btnSave: Locator;

    /** Locator for the Cancel button. */
    readonly btnCancel: Locator;

    readonly fileInputPicture: Locator;

    /**
     * Initializes the locators for the Add Employee page.
     * @param page - The Playwright Page instance passed from the test runner.
     */
    constructor(page: Page) {
        this.page = page;

        // Prioritize getByPlaceholder for straightforward and user-centric element targeting
        this.txtFirstName = page.getByPlaceholder('First Name');
        this.txtMiddleName = page.getByPlaceholder('Middle Name');
        this.txtLastName = page.getByPlaceholder('Last Name');

        // Locate the Employee ID input by associating it with its parent group label
        this.txtEmployeeId = page.locator('.oxd-input-group').filter({hasText: 'Employee Id'}).locator('.oxd-input');   //page.locator('//label[text()="Employee Id"]/ancestor::div[contains(@class, "oxd-input-group")]//input');
        
        // Prioritize getByRole for standard UI buttons
        this.btnSave = page.getByRole('button', {name: 'Save'});
        this.btnCancel = page.getByRole('button', {name: 'Cancel'});
        this.fileInputPicture = page.locator('input[type="file"]');
    }
    
    /**
     * Fills out the employee details form and submits it.
     * * @param firstName - The first name of the employee. Optional.
     * @param middleName - The middle name of the employee. Optional.
     * @param lastName - The last name of the employee. Optional.
     * @param employeeId - The custom employee ID. If provided, it overrides the auto-generated ID. Optional.
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

        if (employeeData.profilePicture) {
   
        await this.fileInputPicture.setInputFiles(employeeData.profilePicture);
    }
    }
}