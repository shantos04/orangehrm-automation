/**
 * @fileoverview Shared Component Object for the Time module's Top Navigation Menu.
 * 
 * This component encapsulates the locators and navigation logic for the horizontal
 * menu bar present across all pages within the Time module (Timesheets, Attendance, 
 * Reports, and Project Info).
 * 
 */

import {Page, Locator} from '@playwright/test';

export class TimeTopMenuComponent {
    readonly page: Page;

    // --- Locators for Main Menu Items ---
    readonly menuTimesheets: Locator;
    readonly menuAttendance: Locator;
    readonly menuReports: Locator;
    readonly menuProjectInfo: Locator;

    // --- Locators for Timesheets Dropdown Sub-menu Items ---
    readonly subMenuMyTimesheets: Locator;
    readonly subMenuEmployeeTimesheets: Locator;

    // --- Locators for Attendance Dropdown Sub-menu Items ---
    readonly subMenuMyRecords: Locator;
    readonly subMenuPunchInOut: Locator;
    readonly subMenuEmployeeRecords: Locator;
    readonly subMenuConfiguration: Locator; 

    // --- Locators for Reports Dropdown Sub-menu Items ---
    readonly subMenuProjectReports: Locator;
    readonly subMenuEmployeeReports: Locator;
    readonly subMenuAttendanceSummary: Locator;

    // --- Locators for Project Info Dropdown Sub-menu Items ---
    readonly subMenuCustomers: Locator;
    readonly subMenuProjects: Locator;

    constructor(page: Page) {
        this.page = page;

        // Main Menus
        this.menuTimesheets = page.locator('.oxd-topbar-body-nav-tab').filter({hasText: 'Timesheets'});
        this.menuAttendance = page.locator('.oxd-topbar-body-nav-tab').filter({hasText: 'Attendance'});
        this.menuReports = page.locator('.oxd-topbar-body-nav-tab').filter({hasText: 'Reports'});
        this.menuProjectInfo = page.locator('.oxd-topbar-body-nav-tab').filter({hasText: 'Project Info'});
    
        // Timesheets Sub-menus
        this.subMenuMyTimesheets = page.getByRole('menuitem', {name: 'My Timesheets'});
        this.subMenuEmployeeTimesheets = page.getByRole('menuitem', {name: 'Employee Timesheets'});

        // Attendance Sub-menus
        this.subMenuMyRecords = page.getByRole('menuitem', {name: 'My Records'});
        this.subMenuPunchInOut = page.getByRole('menuitem', {name: 'Punch In/Out'});
        this.subMenuEmployeeRecords = page.getByRole('menuitem', {name: 'Employee Records'});
        this.subMenuConfiguration = page.getByRole('menuitem', {name: 'Configuration'});
    
        // Reports Sub-menus
        this.subMenuProjectReports = page.getByRole('menuitem', {name: 'Project Reports'});
        this.subMenuEmployeeReports = page.getByRole('menuitem', {name: 'Employee Reports'});
        this.subMenuAttendanceSummary = page.getByRole('menuitem', {name: 'Attendance Summary'});

        // Project Info Sub-menus
        this.subMenuCustomers = page.getByRole('menuitem', {name: 'Customers'});
        this.subMenuProjects = page.getByRole('menuitem', {name: 'Projects'});
    }

    // ========================================================================
    // --- Helper Methods: Safely Open Dropdowns ---
    // ========================================================================  
    /**
     * Safely opens the Timesheets dropdown and waits for animation.
     */
    async openTimesheetsDropdown() {
        await this.menuTimesheets.click();
        await this.subMenuMyTimesheets.waitFor({ state: 'visible' });
    }

    /**
     * Safely opens the Attendance dropdown and waits for animation.
     */
    async openAttendanceDropdown() {
        await this.menuAttendance.click();
        await this.subMenuMyRecords.waitFor({ state: 'visible' });
    }

    /**
     * Safely opens the Reports dropdown and waits for animation.
     */
    async openReportsDropdown() {
        await this.menuReports.click();
        await this.subMenuProjectReports.waitFor({ state: 'visible' });
    }

    /**
     * Safely opens the Project Info dropdown and waits for animation.
     */
    async openProjectInfoDropdown() {
        await this.menuProjectInfo.click();
        await this.subMenuCustomers.waitFor({ state: 'visible' });
    }

    // ========================================================================
    // --- Action Methods: Navigation for Timesheets ---
    // ========================================================================
    async goToMyTimesheets() {
        await this.openTimesheetsDropdown();
        await this.subMenuMyTimesheets.click();
        await this.page.waitForURL('**/time/viewMyTimesheet');
    }

    async goToEmployeeTimesheets() {
        await this.openTimesheetsDropdown();
        await this.subMenuEmployeeTimesheets.click();
        await this.page.waitForURL('**/time/viewEmployeeTimesheet');
    }

    // ========================================================================
    // --- Action Methods: Navigation for Attendance ---
    // ========================================================================

    async goToMyRecords() {
        await this.openAttendanceDropdown();
        await this.subMenuMyRecords.click();
        await this.page.waitForURL('**/attendance/viewMyAttendanceRecord');
    }

    async goToPunchInOut() {
        await this.openAttendanceDropdown();
        await this.subMenuPunchInOut.click();
        // Note: OrangeHRM dynamically redirects to either 'punchIn' or 'punchOut' 
        // depending on the user's current state. Using '*' handles both cases safely.
       await this.page.waitForURL(/.*\/attendance\/punch(In|Out)/);
    }

    async goToEmployeeRecords() {
        await this.openAttendanceDropdown();
        await this.subMenuEmployeeRecords.click();
        await this.page.waitForURL('**/attendance/viewAttendanceRecord');
    }

    async goToAttendanceConfiguration() {
        await this.openAttendanceDropdown();
        await this.subMenuConfiguration.click();
        await this.page.waitForURL('**/attendance/configure');
    }

    // ========================================================================
    // --- Action Methods: Navigation for Reports ---
    // ========================================================================

    async goToProjectReports() {
        await this.openReportsDropdown();
        await this.subMenuProjectReports.click();
        await this.page.waitForURL('**/time/displayProjectReportCriteria');
    }

    async goToEmployeeReports() {
        await this.openReportsDropdown();
        await this.subMenuEmployeeReports.click();
        await this.page.waitForURL('**/time/displayEmployeeReportCriteria');
    }

    async goToAttendanceSummary() {
        await this.openReportsDropdown();
        await this.subMenuAttendanceSummary.click();
        await this.page.waitForURL('**/time/displayAttendanceSummaryReportCriteria');
    }

    // ========================================================================
    // --- Action Methods: Navigation for Project Info ---
    // ========================================================================

    async goToCustomers() {
        await this.openProjectInfoDropdown();
        await this.subMenuCustomers.click();
        await this.page.waitForURL('**/time/viewCustomers');
    }

    async goToProjects() {
        await this.openProjectInfoDropdown();
        await this.subMenuProjects.click();
        await this.page.waitForURL('**/time/viewProjects');
    }
}