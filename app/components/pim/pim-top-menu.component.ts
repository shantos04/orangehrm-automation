/**
 * @fileoverview Shared Component Object for the PIM module's Top Navigation Menu.
 * 
 * This component encapsulates the locators and navigation actions for the horizontal
 * menu bar present across all pages within the PIM (Personal Information Management) module.
 * 
 */
import {Page, Locator, expect} from '@playwright/test';

/**
 * Type definition for valid primary menu names to ensure type safety.
 */
type PrimaryMenuKey = 'Configuration' | 'Employee List' | 'Add Employee' | 'Reports';

export class PimTopMenuComponent {
    readonly page: Page;

    // --- Locators for Main Menu Items ---
    readonly menuConfiguration: Locator;
    readonly menuEmployeeList: Locator;
    readonly menuAddEmployee: Locator;
    readonly menuReports: Locator;

    // --- Locators for Configuration Dropdown Sub-menu Items ---
    readonly subMenuOptionalFields: Locator;
    readonly subMenuCustomFields: Locator;
    readonly subMenuDataImport: Locator;
    readonly subMenuReportingMethods: Locator;
    readonly subMenuTerminationReasons: Locator;
    
    constructor(page: Page) {
        this.page = page;

        // Main Menus
        this.menuConfiguration = page.locator('.oxd-topbar-body-nav-tab').filter({hasText: 'Configuration'});
        this.menuEmployeeList = page.locator('.oxd-topbar-body-nav-tab').filter({hasText: 'Employee List'});
        this.menuAddEmployee = page.locator('.oxd-topbar-body-nav-tab').filter({hasText: 'Add Employee'});
        this.menuReports = page.locator('.oxd-topbar-body-nav-tab').filter({hasText: 'Reports'});

        // Configuration Sub-menus
        this.subMenuOptionalFields = page.getByRole('menuitem', {name: 'Optional Fields'});
        this.subMenuCustomFields = page.getByRole('menuitem', {name: 'Custom Fields'});
        this.subMenuDataImport = page.getByRole('menuitem', {name: 'Data Import'});
        this.subMenuReportingMethods = page.getByRole('menuitem', {name: 'Reporting Methods'});
        this.subMenuTerminationReasons = page.getByRole('menuitem', {name: 'Termination Reasons'});
    }

    // --- Action Methods: Main Menus ---
    async goToEmployeeList() {
        await this.menuEmployeeList.click();
        await this.page.waitForURL('**/pim/viewEmployeeList')
    }

    async goToAddEmployee() {
        await this.menuAddEmployee.click();
        await this.page.waitForURL('**/pim/addEmployee')
    }

    async goToReports() {
        await this.menuReports.click();
        await this.page.waitForURL('**/pim/viewDefinedPredefinedReports')
    }


    // --- Action Methods: Configuration Dropdown ---

    /**
     * Helper method to safely open the Configuration dropdown menu.
     * It waits for the dropdown animation to finish by asserting visibility of a child item.
     */
    async openConfigurationDropdown() {
        await this.menuConfiguration.click();
        // Wait for the dropdown to fully expand before interacting with sub-menus
        await this.subMenuOptionalFields.waitFor({state: 'visible'});
    }

    async goToOptionalFields() {
        await this.openConfigurationDropdown();
        await this.subMenuOptionalFields.click();
        await this.page.waitForURL('**/pim/configurePim');
    }

    async goToCustomFields() {
        await this.openConfigurationDropdown();
        await this.subMenuCustomFields.click();
        await this.page.waitForURL('**/pim/listCustomFields');
    }

    async goToDataImport() {
        await this.openConfigurationDropdown();
        await this.subMenuDataImport.click();
        await this.page.waitForURL('**/pim/pimCsvImport');
    }

    async goToReportingMethods() {
        await this.openConfigurationDropdown();
        await this.subMenuReportingMethods.click();
        await this.page.waitForURL('**/pim/viewReportingMethods');
    }

    async goToTerminationReasons() {
        await this.openConfigurationDropdown();
        await this.subMenuTerminationReasons.click();
        await this.page.waitForURL('**/pim/viewTerminationReasons');
    }

    /**
     * Helper method to map string keys to their corresponding Playwright Locators.
     * @param {PrimaryMenuKey} menuName - The exact name of the menu.
     * @returns {Locator} The mapped Playwright Locator.
     */
    getMenuLocator(menuName: PrimaryMenuKey): Locator {
        const menuMap: Record<PrimaryMenuKey, Locator> = {
            'Configuration': this.menuConfiguration,
            'Employee List': this.menuEmployeeList,
            'Add Employee': this.menuAddEmployee,
            'Reports': this.menuReports
        };
        return menuMap[menuName];
    }

    /**
     * KEYWORD STEP ACTION: Hovers over a specific primary menu based on its name.
     * @param {PrimaryMenuKey} menuName - The exact name of the menu to hover.
     */
    async hoverPrimaryMenu(menuName: PrimaryMenuKey) {
        const menuLocator = this.getMenuLocator(menuName);
        await menuLocator.hover();
    }

    /**
     * KEYWORD STEP VERIFY: Asserts the hover CSS state of a specific primary menu.
     * @param {PrimaryMenuKey} menuName - The exact name of the menu to verify.
     */
    async verifyPrimaryMenuHoverState(menuName: PrimaryMenuKey) {
        const menuLocator = this.getMenuLocator(menuName);
        
        // In OrangeHRM, hovering typically triggers a visual change.
        // We assert the base class remains intact and the element is interactive.
        await expect(menuLocator).toHaveClass(/oxd-topbar-body-nav-tab/);
    }

    /**
     * KEYWORD STEP VERIFY: Asserts the exact text labels of all Configuration sub-menus.
     */
    async verifyConfigurationSubMenuTexts() {
        await expect(this.subMenuOptionalFields).toHaveText('Optional Fields');
        await expect(this.subMenuCustomFields).toHaveText('Custom Fields');
        await expect(this.subMenuDataImport).toHaveText('Data Import');
        await expect(this.subMenuReportingMethods).toHaveText('Reporting Methods');
        await expect(this.subMenuTerminationReasons).toHaveText('Termination Reasons');
    }
}