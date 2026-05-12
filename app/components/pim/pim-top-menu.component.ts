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
     * Helper method to extract the actual computed background color of a menu.
     * @param {PrimaryMenuKey} menuName - The exact name of the menu.
     * @returns {Promise<string>} The RGB/RGBA color string.
     */
    async getMenuBackgroundColor(menuName: PrimaryMenuKey): Promise<string> {
        const menuLocator = this.getMenuLocator(menuName);
        // Inject JavaScript into the browser to read the real-time CSS rendering
        return await menuLocator.evaluate((el) => window.getComputedStyle(el).backgroundColor);
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
     * KEYWORD STEP VERIFY: Asserts that all primary top menu tabs are visible on the UI.
     */
    async verifyPrimaryMenusVisible() {
        await expect(this.menuConfiguration).toBeVisible();
        await expect(this.menuEmployeeList).toBeVisible();
        await expect(this.menuAddEmployee).toBeVisible();
        await expect(this.menuReports).toBeVisible();
    }

    /**
     * KEYWORD STEP VERIFY: Asserts that all sub-menu items within the Configuration dropdown are visible.
     */
    async verifyConfigurationSubMenusVisible() {
        await expect(this.subMenuOptionalFields).toBeVisible();
        await expect(this.subMenuCustomFields).toBeVisible();
        await expect(this.subMenuDataImport).toBeVisible();
        await expect(this.subMenuReportingMethods).toBeVisible();
        await expect(this.subMenuTerminationReasons).toBeVisible();
    }

    /**
     * KEYWORD STEP VERIFY: Asserts that a specific menu tab is currently active (highlighted).
     * @param {PrimaryMenuKey} tabName - The name of the tab to check.
     */
    async verifyTabIsActive(tabName: PrimaryMenuKey) {
        const targetTab = this.getMenuLocator(tabName);
        // OrangeHRM appends the '--visited' class to the active tab
        await expect(targetTab).toHaveClass(/oxd-topbar-body-nav-tab--visited/);
    }

    /**
     * KEYWORD STEP VERIFY: Asserts the visual hover effect by comparing background colors.
     * @param {PrimaryMenuKey} menuName - The exact name of the menu to verify.
     * @param {string} originalColor - The background color captured BEFORE the hover action.
     */
    async verifyPrimaryMenuVisualHover(menuName: PrimaryMenuKey, originalColor: string) {
        // Playwright's expect.toPass() will automatically retry the assertion until the 
        // CSS transition animation finishes and the color actually changes.
        await expect(async () => {
            const hoveredColor = await this.getMenuBackgroundColor(menuName);
            expect(hoveredColor).not.toEqual(originalColor);
        }).toPass({ timeout: 5000 });
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