import { test, expect } from '@playwright/test';
import * as allure from "allure-js-commons";

import { LoginPage } from '../../../app/pages/login.page';
import { TimeTopMenuComponent } from '../../../app/components/time/time-top-menu.component';
import { PunchInOutPage } from '../../../app/pages/time/punch-in-out.page';
import { ToastComponent } from '../../../app/components/common/toast.component';
import { CalendarComponent } from '../../../app/components/common/calendar.component';

import usersData from '../../../data/users.json';
import expectedTexts from '../../../data/expected-texts.json';
import timeData from '../../../data/time-data.json';

/**
 * Test Suite: Time Module - Punch In/Out Page
 * Focuses on the end-to-end flow of employee attendance logging.
 */
test.describe("Time Module - PunchIn/Out Page", () => {
    let loginPage: LoginPage;
    let timeTopMenu: TimeTopMenuComponent;
    let punchIOPage: PunchInOutPage;
    let toastComponent: ToastComponent;
    let calendarComponent: CalendarComponent;

    // ========================================================================
    // GLOBAL SETUP: Authentication and Navigation
    // ========================================================================

    /**
     * Global Setup Hook
     * Initializes Page Objects, sets up Allure metadata, authenticates the user,
     * and navigates to the target Time module before each test execution.
     */
    test.beforeEach(async ({ page }) => {

        // Tab Packages
        await allure.label("package", "OrangeHRM.UI.Time.PunchInOut");

        // Tab Suites   
        await allure.parentSuite("OrangeHRM Project");
        await allure.suite("UI E2E Testing");

        // Tab Behaviors
        await allure.epic("Time Module");

        // Increase timeout for stable execution across complex state setups
        test.setTimeout(60000);

        loginPage = new LoginPage(page);
        timeTopMenu = new TimeTopMenuComponent(page);
        punchIOPage = new PunchInOutPage(page);
        toastComponent = new ToastComponent(page);

        // Pre-condition: Login to the application
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);

        // Navigate to the Timesheet page to access the Time module menu
        await page.goto('/web/index.php/time/viewEmployeeTimesheet');
        await timeTopMenu.goToPunchInOut();
    })

    // ========================================================================
    // GROUP A: PUNCH IN SCENARIOS
    // ========================================================================

    /**
     * Sub-Suite: Punch In Scenarios
     * Contains tests related strictly to the action of punching in (starting a shift).
     */
    test.describe("Punch In Scenario", () => {

        /**
         * State Reset Setup: Ensures the system is strictly in the "Punch In" state.
         * If the user is currently punched in (displaying "Punch Out"), the framework self-heals by punching out first.
         */
        test.beforeEach(async ({ page }) => {
            await allure.subSuite("Time - Punch In Scenarios");
            await allure.feature("Punch In Validation");

            // Wait for the main title to render and capture its current state
            await punchIOPage.mainTitle.waitFor({ state: 'visible' });
            const pageTitle = await punchIOPage.mainTitle.innerText();

            if (pageTitle === 'Punch Out') {
                // Self-healing: Execute a dummy punch-out using current default time to reset the state
                await punchIOPage.punchOut({ date: '', time: '' });

                // Verify the system successfully transitioned back to the 'Punch In' state
                await punchIOPage.verifyMainTitle('Punch In');

                // Ensure the 'In' button is active and ready for interaction
                await expect(punchIOPage.btnIn).toBeVisible();
            } else {
                // Already in the correct state
                await expect(punchIOPage.btnIn).toBeVisible();
            }
        });

        /**
         * Test Case: Verify validation errors when mandatory Punch In fields are empty.
         * Assertion: UI Form Validation (Required fields).
         */
        test("OrangeHRM_TIME_TC01_VerifyPunchInMandatoryFields", async () => {
            await allure.story("Negative - Punch In Empty Fields Validation");
            await allure.severity("normal");

            const expectedRequiredError = expectedTexts.validationMessages.required;

            await test.step("Action: Clear auto-filled fields and click 'In'", async () => {
                await punchIOPage.punchIn({ date: '', time: '' })
            });

            await test.step("Verify: System displays 'Required' error messages for both fields", async () => {
                await punchIOPage.verifyFormValidationErrors({
                    date: expectedRequiredError,
                    time: expectedRequiredError
                });
            });
        });

        /**
         * Test Case: Verify successful Punch In submission with valid data.
         * Assertion: Business Logic, Toast Notification, and State Transition.
         */
        test("OrangeHRM_TIME_TC02_VerifySuccessfulPunchIn", async () => {
            await allure.story("Positive - Valid Punch In Flow");
            await allure.severity("critical");

            // Retrieve valid Punch In data from JSON
            const { date, time, note } = timeData.validPunchIn;
            const expectedSuccessText = expectedTexts.toastMessages.successSaved;

            await test.step("Action: Submit valid Punch In data", async () => {
                // Concurrently wait for the toast message while submitting the form to handle race conditions
                await Promise.all([
                    expect(toastComponent.toastMessage).toBeVisible(),
                    punchIOPage.punchIn({ date, time, note })
                ]);
            });

            await test.step("Verify: Success toast is displayed and UI state shift to 'Punch Out'", async () => {
                await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, { ignoreCase: true });
                await expect(punchIOPage.btnOut).toBeVisible();
                await punchIOPage.verifyMainTitle('Punch Out');
            });
        });

    })

    // ========================================================================
    // GROUP B: PUNCH OUT SCENARIOS
    // ========================================================================

    /**
     * Sub-Suite: Punch Out Scenarios
     * Contains tests related strictly to the action of punching out (ending a shift),
     * focusing heavily on timeline logic validations against the punch-in record.
     */
    test.describe("Punch Out Scenarios", () => {

        /**
         * State Reset Setup: Ensures the system is strictly in the "Punch Out" state.
         * If the user is currently punched out (displaying "Punch In"), the framework self-heals by punching in first.
         */
        test.beforeEach(async () => {
            await allure.subSuite("Time - Punch Out Scenarios");
            await allure.feature("Punch Out Validation");

            await punchIOPage.mainTitle.waitFor({ state: 'visible' });
            const pageTitle = await punchIOPage.mainTitle.innerText();

            if (pageTitle === 'Punch In') {
                // Self-healing: Execute a dummy punch-in using current default time to reset the state
                await punchIOPage.punchOut({ date: '', time: '' });
                await punchIOPage.verifyMainTitle('Punch Out');
                await expect(punchIOPage.btnOut).toBeVisible();
            } else {
                await expect(punchIOPage.btnOut).toBeVisible();
            }
        });

        /**
         * Test Case: Verify validation errors when mandatory Punch Out fields are empty.
         * Assertion: UI Form Validation (Required fields).
         */
        test("OrangeHRM_TIME_TC03_VerifyPunchOutMandatoryFields", async () => {
            await allure.story("Negative - Punch Out Empty Fields Validation");
            await allure.severity("normal");

            const expectedRequiredError = expectedTexts.validationMessages.required

            await test.step("Action: Clear auto-filled fields and click 'Out'", async () => {
                await punchIOPage.punchOut({ date: '', time: '' });
            });

            await test.step("Verfiy: System displays 'Required' error message for both fields", async () => {
                await punchIOPage.verifyFormValidationErrors({
                    date: expectedRequiredError,
                    time: expectedRequiredError
                });
            });
        });

        /**
         * Test Case: Verify system behavior when an incorrectly formatted date string is submitted.
         * Assertion: Form Validation (Format compliance).
         */
        test("OrangeHRM_TIME_TC04_VerifyInvalidDayFormat", async () => {
            await allure.story("Negative - Invalid Date Format Processing");
            await allure.severity("normal");

            const invalidDate = timeData.invalidData.format.date;
            const validTime = timeData.validPunchOut.time;
            const expectedFormatError = expectedTexts.validationMessages.invalidDateFormat;

            await test.step("Action: Attempt to submit a date with an invalid format", async () => {
                await punchIOPage.punchOut({ date: invalidDate, time: validTime }, false);
                await punchIOPage.btnOut.click();
            });

            await test.step("Verify: System displays an invalid format error for the Date field", async () => {
                await punchIOPage.verifyFormValidationErrors({ date: expectedFormatError });
            });
        });

        /**
         * Test Case: Verify system auto-correction logic when an incorrectly formatted time is provided.
         * Assertion: Data sanitization and Form Validation.
         */
        test("OrangeHRM_TIME_TC05_VerifyAutoCorrectionOnInvalidTime", async () => {
            await allure.story("Negative - Invalid Time Format Auto-Correction");
            await allure.severity("normal");

            const validDate = timeData.validPunchOut.date;
            const invalidTime = timeData.invalidData.format.time;
            const expectedRequiredError = expectedTexts.validationMessages.required;

            test.step("Action: Input an invalid time format and trigger validation", async () => {
                // Use defensive programming (false flag) to prevent navigation/timeouts on invalid data
                await punchIOPage.punchOut({ date: validDate, time: invalidTime }, false);
                await punchIOPage.btnOut.click();
            });

            test.step("Verify: System auto-clears the invalid time and flags it as required", async () => {
                await expect(punchIOPage.txtTime).toHaveValue('');
                await punchIOPage.verifyFormValidationErrors({ time: expectedRequiredError });
            });
        });

        /**
         * Test Case: Verify business logic preventing a Punch Out time that occurs BEFORE the Punch In time.
         * Assertion: Business Logic Constraint (Timeline consistency).
         */
        test("OrangeHRM_TIME_TC06_VerifyPunchOutTimeLessThanPunchInTime", async () => {
            await allure.story("Business Logic - Time Validation Against Punch In");
            await allure.severity("critical");

            const validDate = timeData.validPunchOut.date;
            const timeBeforeIn = timeData.invalidData.logic.timeBeforeIn;
            const expectedLogicError = expectedTexts.validationMessages.higherThanPunchIn;

            await test.step("Action: Attempt to punch out at a time BEFORE the punch in time", async () => {
                await punchIOPage.punchOut({ date: validDate, time: timeBeforeIn }, false);
                await punchIOPage.btnOut.click();
            });

            await test.step("Verify: System rejects the input due to illogical timeline", async () => {
                await punchIOPage.verifyFormValidationErrors({ time: expectedLogicError });
            });
        });

        /**
         * Test Case: Verify business logic preventing a Punch Out date that occurs BEFORE the Punch In date.
         * Assertion: Business Logic Constraint (Timeline consistency).
         */
        test("OrangeHRM_TIME_TC07_VerifyPunchOutDateLessThanPunchInDate", async () => {
            await allure.story("Business Logic - Date Validation Against Punch In");
            await allure.severity("critical");

            const pastDate = timeData.invalidData.logic.pastDate;
            const validTime = timeData.validPunchOut.time;
            const expectedLogicError = expectedTexts.validationMessages.higherThanPunchIn;

            await test.step("Action: Attempt to punch out on a date BEFORE the punch in date", async () => {
                await punchIOPage.punchOut({ date: pastDate, time: validTime }, false);
                await punchIOPage.btnOut.click();
            });

            await test.step("Verify: System rejects the input due to illogical timeline", async () => {
                await punchIOPage.verifyFormValidationErrors({ date: expectedLogicError });
            });
        });

    })
})