/**
 * @fileoverview Unified test suite for the Calendar Widget on the Attendance (Punch In/Out) page.
 * The calendar component shares the exact same DOM structure regardless of whether the user
 * is currently in the "Punch In" or "Punch Out" state. This suite tests the widget agnostically.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../app/pages/login.page';
import { TimeTopMenuComponent } from '../../app/components/time/time-top-menu.component';
import { PunchInOutPage } from '../../app/pages/time/punch-in-out.page';
import { CalendarComponent } from '../../app/components/common/calendar.component';

// Import Data-Driven files
import usersData from '../../data/users.json';

test.describe("Time Module - Shared Calendar Widget (Punch In/Out)", () => {
    let loginPage: LoginPage;
    let timeTopMenu: TimeTopMenuComponent;
    let punchIOPage: PunchInOutPage;
    let calendarComp: CalendarComponent;

    // ========================================================================
    // GLOBAL SETUP: Authentication and Navigation
    // ========================================================================
    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000);

        loginPage = new LoginPage(page);
        timeTopMenu = new TimeTopMenuComponent(page);
        punchIOPage = new PunchInOutPage(page);
        
        // Initialize the Calendar Component specifically for the first date wrapper (index 0).
        // This targets the 'Date' field perfectly on BOTH Punch In and Punch Out forms.
        calendarComp = new CalendarComponent(page, 0);

        // Pre-condition: Login and navigate to the Attendance page
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password); 

        await page.waitForURL('**/dashboard/index');
        
        await page.goto('/web/index.php/time/viewEmployeeTimesheet');
        await timeTopMenu.goToPunchInOut();

        // Wait for the main container to load to ensure the page is ready.
        // We do NOT enforce a specific In/Out state, as the calendar widget is shared.
        await punchIOPage.mainTitle.waitFor({ state: 'visible' });
    });

    // ========================================================================
    // TEST CASES FOR SHARED CALENDAR WIDGET
    // ========================================================================

    test("OrangeHRM_TIME_CAL_TC01_Verify_Opening_Calendar_Widget", async () => {
        // Utilize the POM method to safely open the calendar and wait for Vue.js rendering
        await calendarComp.openCalendar();

        // Assert that the dynamic calendar container is injected and visible
        await expect(calendarComp.calendarContainer).toBeVisible();
    });

    test("OrangeHRM_TIME_CAL_TC02_Verify_Selecting_Specific_Date", async () => {
        const targetYear = '2026';
        const targetMonth = 'May';
        const targetDay = '15';
        const expectedFormat = '2026-05-15';

        // Select the full date using the encapsulated component method
        await calendarComp.selectFullDate(targetYear, targetMonth, targetDay);

        // Assert that the calendar automatically closes after a specific day is selected
        await expect(calendarComp.calendarContainer).toBeHidden();

        // Assert that the input field displays the correctly formatted date
        await expect(punchIOPage.txtDate).toHaveValue(expectedFormat);
    });

    test("OrangeHRM_TIME_CAL_TC03_Verify_Today_Shortcut_Button", async () => {
        await calendarComp.openCalendar();

        // Click the 'Today' button located in the calendar footer
        await calendarComp.btnToday.click();

        // Assert that the calendar closes automatically
        await expect(calendarComp.calendarContainer).toBeHidden();

        // Dynamically calculate the system's current date in YYYY-MM-DD format
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        const localDate = new Date(today.getTime() - offset);
        const expectedDateString = localDate.toISOString().split('T')[0];

        // Assert that the input field contains today's exact date
        await expect(punchIOPage.txtDate).toHaveValue(expectedDateString);
    });

    test("OrangeHRM_TIME_CAL_TC04_Verify_Clear_Shortcut_Button", async () => {
        // Pre-fill the input field to ensure there is existing data to clear
        await punchIOPage.txtDate.fill('2026-05-05');
        
        await calendarComp.openCalendar();

        // Click the 'Clear' button located in the calendar footer
        await calendarComp.btnClear.click();

        // Assert that the calendar closes automatically
        await expect(calendarComp.calendarContainer).toBeHidden();

        // Assert that the input field has been successfully wiped empty
        await expect(punchIOPage.txtDate).toHaveValue('');
    });

    test("OrangeHRM_TIME_CAL_TC05_Verify_Close_Shortcut_Button", async () => {
        // Pre-fill the input field with a baseline date to verify it remains unchanged
        const baselineDate = '2026-05-05';
        await punchIOPage.txtDate.fill(baselineDate);

        await calendarComp.openCalendar();

        // Click the 'Close' button located in the calendar footer
        await calendarComp.btnClose.click();

        // Assert that the calendar dismisses without altering the pre-existing input value
        await expect(calendarComp.calendarContainer).toBeHidden();
        await expect(punchIOPage.txtDate).toHaveValue(baselineDate);
    });
});