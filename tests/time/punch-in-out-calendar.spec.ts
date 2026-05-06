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

    test("OrangeHRM_TIME_CAL_TC01_VerifyOpeningCalendarWidget", async ({page}, testInfo) => {
        // Utilize the POM method to safely open the calendar and wait for Vue.js rendering
        await calendarComp.openCalendar();

        // Assert that the dynamic calendar container is injected and visible
        await expect(calendarComp.calendarContainer).toBeVisible();

        // Capture the entire viewport to show the calendar is open and rendered correctly
        const screenshot = await page.screenshot();
        await testInfo.attach('Evidence-TC01-Calendar-Opened', { 
            body: screenshot, 
            contentType: 'image/png' 
        });
    });

    test("OrangeHRM_TIME_CAL_TC02_VerifySelectingSpecificDate", async ({page}, testInfo) => {
        const targetYear = '2026';
        const targetMonth = 'May';
        const targetDay = '15';
        const expectedFormat = '2026-15-05';

        // Select the full date using the encapsulated component method
        await calendarComp.selectFullDate(targetYear, targetMonth, targetDay);

        // Assert that the calendar automatically closes after a specific day is selected
        await expect(calendarComp.calendarContainer).toBeHidden();

        // Assert that the input field displays the correctly formatted date
        await expect(punchIOPage.txtDate).toHaveValue(expectedFormat);

        // Capture ONLY the input field element to prove it contains the new date
        const elementScreenshot = await punchIOPage.txtDate.screenshot();
        await testInfo.attach('Evidence-TC02-Date-Selected', { 
            body: elementScreenshot, 
            contentType: 'image/png' 
        });
    });

    test("OrangeHRM_TIME_CAL_TC03_VerifyTodayShortcutButton", async ({ page }, testInfo) => {
        await calendarComp.openCalendar();

        // Click the 'Today' button located in the calendar footer
        await calendarComp.btnToday.click();

        // Assert that the calendar closes automatically
        await expect(calendarComp.calendarContainer).toBeHidden();

        // Dynamically calculate the system's current date in YYYY-DD-MM format
        // to match the specific Date Format configuration of this OrangeHRM instance.
        const today = new Date();
        const year = today.getFullYear();
        
        // getMonth() is zero-based (Jan = 0), so we add 1. 
        // padStart(2, '0') ensures it's always 2 digits (e.g., '5' becomes '05')
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        // Construct the expected string specifically as yyyy-dd-mm
        const expectedDateString = `${year}-${day}-${month}`;

        // Assert that the input field contains today's exact date in the correct format
        await expect(punchIOPage.txtDate).toHaveValue(expectedDateString);

        // Capture the input field showing today's date
        const elementScreenshot = await punchIOPage.txtDate.screenshot();
        await testInfo.attach('Evidence-TC03-Today-Date-Populated', { 
            body: elementScreenshot, 
            contentType: 'image/png' 
        });
    });

    test("OrangeHRM_TIME_CAL_TC04_VerifyClearShortcutButton", async ({page}, testInfo) => {
        // Pre-fill the input field to ensure there is existing data to clear
        await punchIOPage.txtDate.fill('2026-05-05');
        
        await calendarComp.openCalendar();

        // Click the 'Clear' button located in the calendar footer
        await calendarComp.btnClear.click();

        // Assert that the calendar closes automatically
        await expect(calendarComp.calendarContainer).toBeHidden();

        // Assert that the input field has been successfully wiped empty
        await expect(punchIOPage.txtDate).toHaveValue('');

        // Capture the input field to prove it is completely empty
        const elementScreenshot = await punchIOPage.txtDate.screenshot();
        await testInfo.attach('Evidence-TC04-Date-Cleared', { 
            body: elementScreenshot, 
            contentType: 'image/png' 
        });
    });

    test("OrangeHRM_TIME_CAL_TC05_VerifyCloseShortcutButton", async ({page}, testInfo) => {
        // Pre-fill the input field with a baseline date to verify it remains unchanged
        const baselineDate = '2026-05-05';
        await punchIOPage.txtDate.fill(baselineDate);

        await calendarComp.openCalendar();

        // Click the 'Close' button located in the calendar footer
        await calendarComp.btnClose.click();

        // Assert that the calendar dismisses without altering the pre-existing input value
        await expect(calendarComp.calendarContainer).toBeHidden();
        await expect(punchIOPage.txtDate).toHaveValue(baselineDate);

        // Capture the entire Punch In/Out card container.
        const formContainer = page.locator('.orangehrm-card-container');
        const formScreenshot = await formContainer.screenshot();
        
        await testInfo.attach('Evidence-Complete-Form-State', { 
            body: formScreenshot, 
            contentType: 'image/png' 
        });
    });
});