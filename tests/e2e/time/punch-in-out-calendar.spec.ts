/**
 * @fileoverview Unified test suite for the Calendar Widget on the Attendance (Punch In/Out) page.
 * The calendar component shares the exact same DOM structure regardless of whether the user
 * is currently in the "Punch In" or "Punch Out" state. This suite tests the widget agnostically.
 */

import { test, expect } from '../../../fixtures/e2e/time.fixture';
import * as allure from "allure-js-commons";

// Import Data-Driven files
import expectedTexts from '../../../data/expected-texts.json';

test.describe("Time Module - Shared Calendar Widget (Punch In/Out)", () => {

    // ========================================================================
    // GLOBAL SETUP: Authentication and Navigation
    // ========================================================================
    test.beforeEach(async ({ page }) => {
        // --- Tab Packages ---
        await allure.label("package", "OrangeHRM.UI.Time.Calendar");

        // --- Tab Suites ---
        await allure.parentSuite("OrangeHRM Project");
        await allure.suite("UI E2E Testing");
        await allure.subSuite("Time - Calendar Widget");

        // --- Tab Behaviors ---
        await allure.epic("Time Module");
        await allure.feature("Attendance Calendar");
    });

    // ========================================================================
    // UI VISIBILITY & BASIC INTERACTION
    // ========================================================================

    /**
     * Test Case: Verify the visibility of the Date Picker calendar widget.
     * Assertion: Ensures the dynamic calendar component renders and becomes visible upon interaction with the date input field, and captures screenshot evidence.
     */
    test("OrangeHRM_TIME_CAL_TC01_VerifyOpeningCalendarWidget", async ({ page, calendarComp }, testInfo) => {
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
    test("OrangeHRM_TIME_CAL_TC02_VerifySelectingSpecificDate", async ({ calendarComp, punchIOPage }, testInfo) => {
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
    test("OrangeHRM_TIME_CAL_TC03_VerifyTodayShortcutButton", async ({ calendarComp, punchIOPage }, testInfo) => {
        await allure.story("Widget Feature - 'Today' Shortcut Button");
        await allure.severity("medium");

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
    test("OrangeHRM_TIME_CAL_TC04_VerifyClearShortcutButton", async ({ calendarComp, punchIOPage }, testInfo) => {
        await allure.story("Widget Feature - 'Clear' Shortcut Button");
        await allure.severity("medium");

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
    test("OrangeHRM_TIME_CAL_TC05_VerifyCloseShortcutButton", async ({ page, calendarComp, punchIOPage }, testInfo) => {
        await allure.story("Widget Feature - 'Close' Shortcut Button");
        await allure.severity("major");

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

    // ========================================================================
    // ADVANCED NAVIGATION & SELECTION
    // ========================================================================

    /**
     * Test Case: Verify navigating to the next month using the calendar's right arrow.
     * Assertion: Ensures the calendar correctly shifts to the subsequent month.
     */
    test("OrangeHRM_TIME_CAL_TC06_VerifyNextMonthNavigation", async ({ calendarComp }) => {
        await allure.story("Widget Navigation - Next Month Arrow");
        await allure.severity("medium");

        let initialMonth: string;

        await test.step("Action: Open calendar and record the current month", async () => {
            await calendarComp.openCalendar();
            initialMonth = await calendarComp.lblCurrentMonth.innerText();
        });

        await test.step("Action: Click the next month arrow", async () => {
            await calendarComp.btnNextMonth.click();
        });

        await test.step("Verify: Calendar UI updates to display the next month", async () => {
            await expect(calendarComp.lblCurrentMonth).not.toHaveText(initialMonth);
        });
    });

    /**
     * Test Case: Verify navigating to the previous month using the calendar's left arrow.
     * Assertion: Ensures the calendar correctly shifts to the preceding month.
     */
    test("OrangeHRM_TIME_CAL_TC07_VerifyPreviousMonthNavigation", async ({ calendarComp }) => {
        await allure.story("Widget Navigation - Previous Month Arrow");
        await allure.severity("medium");

        let initialMonth: string;

        await test.step("Action: Open calendar and record the current month", async () => {
            await calendarComp.openCalendar();
            initialMonth = await calendarComp.lblCurrentMonth.innerText();
        });

        await test.step("Action: Click the previous month arrow", async () => {
            await calendarComp.btnPrevMonth.click();
        });

        await test.step("Verify: Calendar UI updates to display previous month", async () => {
            await expect(calendarComp.lblCurrentMonth).not.toHaveText(initialMonth);
        });
    });

    /**
     * Test Case: Verify month selection via the Month Dropdown.
     * Assertion: Directly jumping to a specific month renders the correct days grid.
     */
    test("OrangeHRM_TIME_CAL_TC08_VerifyMonthDropdownSelection", async ({ calendarComp }) => {
        await allure.story("Widget Navigation - Month Dropdown");
        await allure.severity("Medium");

        const targetMonth = 'December';

        await test.step("Action: Open calendar and select a specific month from the dropdown", async () => {
            await calendarComp.openCalendar();
            await calendarComp.selectMonth(targetMonth);
        });

        await test.step("Verify: The calendar displays the newly selected month", async () => {
            await expect(calendarComp.lblCurrentMonth).toHaveText(targetMonth)
        });
    });

    /**
     * Test Case: Verify year selection via the Year Dropdown.
     * Assertion: Directly jumping to a specific historical/future year updates the UI.
     */
    test("OrangeHRM_TIME_CAL_TC09_VerifyYearDropdownSelection", async ({ calendarComp }) => {
        await allure.story("Widget Navigation - Year Dropdown");
        await allure.severity("Medium");

        const targetYear = '2024';

        await test.step("Action: Open calendar and select a specific year from the dropdown", async () => {
            await calendarComp.openCalendar();
            await calendarComp.selectYear(targetYear);
        });

        await test.step("Verify: The calendar displays the newly selected year", async () => {
            await expect(calendarComp.lblCurrentYear).toHaveText(targetYear);
        });
    });

    /**
     * Test Case: Verify Leap Year boundary date selection (February 29th).
     * Assertion: Ensures the calendar correctly handles and permits selecting a valid leap year date.
     */
    test("OrangeHRM_TIME_CAL_TC10_VerifyLeapYearDateSelection", async ({ calendarComp, punchIOPage }, testInfo) => {
        await allure.story("Boundary Testing - Leap Year Validation");
        await allure.story("critical");

        const targetYear = '2024';
        const targetMonth = 'February';
        const targetDay = '29';
        const expectedFormat = '2024-29-02';

        await test.step("Action: Select February 29th of a known leap year", async () => {
            await calendarComp.selectFullDate(targetYear, targetMonth, targetDay);
        });

        await test.step("Verify: Leap year date is accepted and formatted correctly", async () => {
            await calendarComp.verifyCalendarIsHidden();
            await calendarComp.verifySelectedDateValue(expectedFormat);

            const elementScreenshot = await punchIOPage.txtDate.screenshot();
            await testInfo.attach('Evidence-TC10-Leap-Year', { body: elementScreenshot, contentType: 'image/png' });
        });
    });

    // ========================================================================
    // INPUT VALIDATION & BEHAVIOR
    // ========================================================================

    /**
     * Test Case: Verify dismissing the calendar by clicking completely outside of it (Blur).
     * Assertion: The calendar should behave like a standard popup and close when losing focus.
     */
    test("OrangeHRM_TIME_CAL_TC11_VerifyDismissCalendarOnClickOutside", async ({ calendarComp, punchIOPage }) => {
        await allure.story("UI Interaction - Blur/Click Outside");
        await allure.story("minor");

        await test.step("Action: Open Calendar, then click main page header", async () => {
            await calendarComp.openCalendar();
            await calendarComp.verifyCalendarIsVisible();

            await punchIOPage.mainTitle.click();
        });

        await test.step("Verify: The calendar widget automatically dismisses", async () => {
            await calendarComp.verifyCalendarIsHidden();
        });
    });

    /**
     * Test Case: Verify manual keystroke input bypasses the UI calendar widget.
     * Assertion: Users can type a valid date directly into the input field without using the picker.
     */
    test("OrangeHRM_TIME_CAL_TC12_VerifyManualValidDateInput", async ({ punchIOPage }) => {
        await allure.story("Input Validation - Manual Valid Data Entry");
        await allure.severity("normal");

        const manualDate = '2026-25-12';

        await test.step("Action: Type a valid date string directly into the text field", async () => {
            await punchIOPage.txtDate.fill(manualDate);
            // Press Tab or click away to trigger frontend validation event
            await punchIOPage.txtDate.press('Tab');
        });

        await test.step("Verify: The system accepts the manual input without throwing formatting errors", async () => {
            await expect(punchIOPage.txtDate).toHaveValue(manualDate);
        });
    });

    /**
     * Test Case: Verify format validation for explicitly invalid date string inputs.
     * Assertion: Entering alphabetical characters or wrong formats triggers an inline error.
     */
    test("OrangeHRM_TIME_CAL_TC13_VerifyInvalidDateFormatError", async ({ punchIOPage }) => {
        await allure.story("Negative Testing - Invalid Format Validation");
        await allure.severity("critical");

        const invalidDate = 'Invalid-Date-String';

        await test.step("Action: Input purely alphabetical characters into the date field", async () => {
            await punchIOPage.txtDate.fill(invalidDate);
            // Trigger validation by clicking an empty space or pressing Tab
            await punchIOPage.mainTitle.click();
        });

        await test.step("Verify: System displays standard validation error", async () => {
            await expect(punchIOPage.errorMessageDate).toBeVisible();
            await expect(punchIOPage.errorMessageDate).toContainText(expectedTexts.validationMessages.invalidDateFormat);
        });
    });

    /**
     * Test Case: Verify required field validation when leaving the date blank.
     * Assertion: Clearing the date and attempting to save triggers a "Required" error.
     */
    test("OrangeHRM_TIME_CAL_TC14_VerifyEmptyDateRequiredError", async ({ punchIOPage }) => {
        await allure.story("Negative Testing - Required Field Validation");
        await allure.severity("critical");

        await test.step("Action: Completely clear the date field and trigger submission", async () => {
            await punchIOPage.txtDate.fill('');
            await (punchIOPage.btnIn || punchIOPage.btnOut).click();
        });

        await test.step("Verify: Form halts submission and shows 'Required' message", async () => {
            await expect(punchIOPage.errorMessageDate).toBeVisible();
            await expect(punchIOPage.errorMessageDate).toContainText(expectedTexts.validationMessages.required);
        });
    });

    /**
     * Test Case: Verify Future Year restriction discrepancy (UI vs Manual Input).
     * Assertion: Ensures the calendar dropdown restricts selection to the current year, but manual input permits future years without throwing validation errors.
     */
    test("OrangeHRM_TIME_CAL_TC15_VerifyFutureYearManualInputBypass", async ({ punchIOPage, calendarComp }) => {
        await allure.story("Edge Case - Future Year Manual Input Bypass");
        await allure.severity("normal");

        const today = new Date();
        const currentYear = today.getFullYear();
        const futureYear = currentYear + 1;

        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');

        const futureDateStr = `${futureYear}-${date}-${month}`;

        await test.step(`Verify: Calendar UI limits the Year dropdown up to ${currentYear}`, async () => {
            await calendarComp.openCalendar();

            await calendarComp.yearDropdown.click();

            await expect(calendarComp.calendarContainer).not.toContainText(String(futureYear));

            await punchIOPage.mainTitle.click();
        });

        await test.step(`Action: Manually input a date with the future year (${futureYear}) bypass`, async () => {
            await punchIOPage.txtDate.fill('');
            await punchIOPage.txtDate.fill(futureDateStr);

            await punchIOPage.mainTitle.click();
        });

        await test.step("Verify: System accepts the manual future year input without errors", async () => {
            await expect(punchIOPage.txtDate).toHaveValue(futureDateStr);

            await expect(punchIOPage.errorMessageDate).toBeHidden();
        });
    });
});