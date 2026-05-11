/**
 * @fileoverview Unified test suite for the Calendar Widget on the Attendance (Punch In/Out) page.
 * The calendar component shares the exact same DOM structure regardless of whether the user
 * is currently in the "Punch In" or "Punch Out" state. This suite tests the widget agnostically.
 */

import { test, expect } from '@playwright/test';
import * as allure from "allure-js-commons";

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
        // --- Allure Metadata ---
        await allure.epic("Time Module");
        await allure.feature("Calendar Widget UI Component");

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

    /**
     * Test Case: Verify the visibility of the Date Picker calendar widget.
     * Assertion: Ensures the dynamic calendar component renders and becomes visible upon interaction with the date input field, and captures screenshot evidence.
     */
    test("OrangeHRM_TIME_CAL_TC01_VerifyOpeningCalendarWidget", async ({page}, testInfo) => {
        await allure.story("UI Interaction - Open Calendar Widget");
        await allure.severity("critical");

        await test.step("Action: Click the calendar icon", async () => {
            // Utilize the POM method to safely open the calendar
            await calendarComp.openCalendar();
        });

        await test.step("Verify: Dynamic calendar is injected and visible", async () => {
            // Assert that the dynamic calendar container is injected and visible
            await calendarComp.verifyCalendarIsVisible();

            // Capture the entire viewport to show the calendar is open and rendered correctly
            const screenshot = await page.screenshot();
            await testInfo.attach('Evidence-TC01-Calendar-Opened', { 
                body: screenshot, 
                contentType: 'image/png' 
            });
        });
    });

    /**
     * Test Case: Verify the date selection functionality within the Date Picker.
     * Assertion: Ensures selecting a specific year, month, and day correctly populates the input field with the designated date format, dismisses the calendar, and captures evidence.
     */
    test("OrangeHRM_TIME_CAL_TC02_VerifySelectingSpecificDate", async ({page}, testInfo) => {
        await allure.story("UI Interaction - Select Specific Date");
        await allure.severity("critical");

        const targetYear = '2026';
        const targetMonth = 'May';
        const targetDay = '15';
        const expectedFormat = '2026-15-05';

        await test.step("Action: Select specific Year, Month and Day from the widget", async () => {
            // Select the full date using the encapsulated component method
            await calendarComp.selectFullDate(targetYear, targetMonth, targetDay);
        });

        await test.step("Verify: Calendar closes and input field displays the correct date format", async () => {
            // Assert that the calendar automatically closes after a specific day is selected
            await calendarComp.verifyCalendarIsHidden();

            // Assert that the input field displays the correctly formatted date
            await calendarComp.verifySelectedDateValue(expectedFormat);

            // Capture ONLY the input field element to prove it contains the new date
            const elementScreenshot = await punchIOPage.txtDate.screenshot();
            await testInfo.attach('Evidence-TC02-Date-Selected', { 
                body: elementScreenshot, 
                contentType: 'image/png' 
            });
        });
    });

    /**
     * Test Case: Verify the functionality of the 'Today' shortcut button.
     * Assertion: Ensures clicking 'Today' correctly calculates the system's current date, formats it according to system settings (YYYY-DD-MM), populates the field, and closes the widget.
     */
    test("OrangeHRM_TIME_CAL_TC03_VerifyTodayShortcutButton", async ({ page }, testInfo) => {
        await allure.story("Widget Feature - 'Today' Shortcut Button");
        await allure.severity("normal");
        
        await test.step("Action: Open calendar and click the 'Today' shortcut button", async () => {
            await calendarComp.openCalendar();
            await calendarComp.selectToday();
        });

        await test.step("Verify: Calendar closes and input field with system's current date", async () => {
            // Assert that the calendar closes automatically
            await expect(calendarComp.calendarContainer).toBeHidden();

            // Dynamically calculate the system's current date in YYYY-DD-MM format
            // to match the specific Date Format configuration of this OrangeHRM instance.
            const today = new Date();
            const year = today.getFullYear();

            // getMonth() is zero-based (Jan = 0), so we add 1. 
            // padStart(2, '0') ensures it's always 2 digits (e.g., '5' becomes '05')
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const date = String(today.getDate()).padStart(2, '0');

            // Construct the expected string specifically as yyyy-dd-mm
            const expectedDateString = `${year}-${date}-${month}`;

            // Assert that the input field contains today's exact date in the correct format
            await calendarComp.verifySelectedDateValue(expectedDateString);

            // Capture the input field showing today's date
            const elementScreenshot = await punchIOPage.txtDate.screenshot();
            await testInfo.attach('Evidence-TC03-Today-Date-Populated', { 
                body: elementScreenshot, 
                contentType: 'image/png' 
            });
        });
    });

    /**
     * Test Case: Verify the functionality of the 'Clear' shortcut button.
     * Assertion: Ensures clicking 'Clear' successfully removes any existing data from the input field and dismisses the calendar widget.
     */
    test("OrangeHRM_TIME_CAL_TC04_VerifyClearShortcutButton", async ({page}, testInfo) => {
        await allure.story("Widget Feature - 'Clear' Shortcut Button");
        await allure.severity("normal");

        await test.step("Action: Pre-fill date, open calendar and Click 'Clear'", async () => {
            // Pre-fill the input field to ensure there is existing data to clear
            await punchIOPage.txtDate.fill('2026-05-05');
        
            await calendarComp.openCalendar();
            await calendarComp.clearDate();
        });

        await test.step("Verify: Calendar closes and input field is emptied", async () => {
            // Assert that the calendar closes automatically
            await expect(calendarComp.calendarContainer).toBeHidden();

            // Assert that the input field has been successfully wiped empty
            await calendarComp.verifyDateIsEmpty();

            // Capture the input field to prove it is completely empty
            const elementScreenshot = await punchIOPage.txtDate.screenshot();
            await testInfo.attach('Evidence-TC04-Date-Cleared', { 
                body: elementScreenshot, 
                contentType: 'image/png' 
            });
        });
    });

    /**
     * Test Case: Verify the functionality of the 'Close' shortcut button.
     * Assertion: Ensures clicking 'Close' dismisses the calendar without altering any pre-existing data in the input field, maintaining the initial UI state.
     */
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