import {test, expect} from '@playwright/test';

import {LoginPage} from '../../app/pages/login.page';
import {TimeTopMenuComponent} from '../../app/components/time/time-top-menu.component';
import {PunchInOutPage} from '../../app/pages/time/punch-in-out.page';
import {ToastComponent} from '../../app/components/common/toast.component';
import {CalendarComponent} from '../../app/components/common/calendar.component';

import usersData from '../../data/users.json';
import expectedTexts from '../../data/expected-texts.json';
import timeData from '../../data/time-data.json';

test.describe("Time Module - PunchIn/Out Page", () => {
    let loginPage: LoginPage;
    let timeTopMenu: TimeTopMenuComponent;
    let punchIOPage: PunchInOutPage;
    let toastComponent: ToastComponent;
    let calendarComponent: CalendarComponent;

    // ========================================================================
    // GLOBAL SETUP: Authentication and Navigation
    // ========================================================================
    test.beforeEach(async ({page}) => {

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
    test.describe("Punch In Scenario", () => {

        /**
         * State Reset Setup: Ensures the system is strictly in the "Punch In" state.
         * If the user is currently punched in (displaying "Punch Out"), the framework self-heals by punching out first.
         */
        test.beforeEach(async ({page}) => {
            await punchIOPage.mainTitle.waitFor({ state: 'visible' });
            const pageTitle = await punchIOPage.mainTitle.innerText();

            if (pageTitle === 'Punch Out') {    
                await punchIOPage.punchOut({date: '', time: ''});   // Uses default current time to punch out

                // Verify the Heading have 'Punch In' text
                await punchIOPage.verifyMainTitle('Punch In');

                // Verify the UI is now ready for Punch In
                await expect(punchIOPage.btnIn).toBeVisible();
            } else {
                // Already in the correct state
                await expect(punchIOPage.btnIn).toBeVisible();
            }
        });

        test("OrangeHRM_TIME_TC01_VerifyPunchInMandatoryFields", async() => {
            const expectedRequiredError = expectedTexts.validationMessages.required;
            
            await test.step("Action: Clear auto-filled fields and click 'In'", async () => {
                await punchIOPage.punchIn({date: '', time: ''})
            });

            await test.step("Verify: System displays 'Required' error messages for both fields", async () => {
                await punchIOPage.verifyFormValidationErrors({
                    date: expectedRequiredError,
                    time: expectedRequiredError
                });
            });
        });

        test("OrangeHRM_TIME_TC02_VerifySuccessfulPunchIn", async() => {
            // Retrieve valid Punch In data from JSON
            const {date, time, note} = timeData.validPunchIn;
            const expectedSuccessText = expectedTexts.toastMessages.successSaved;

            await test.step("Action: Submit valid Punch In data", async () => {
                await Promise.all([
                    expect(toastComponent.toastMessage).toBeVisible(),
                    punchIOPage.punchIn({date, time, note})
                ]);
            });

            await test.step("Verify: Success toast is displayed and UI state shift to 'Punch Out'" , async () => {
                await expect(toastComponent.toastMessage).toContainText(expectedSuccessText, {ignoreCase: true});
                await expect(punchIOPage.btnOut).toBeVisible();
                await punchIOPage.verifyMainTitle('Punch Out');
            });
        });

    })

    // ========================================================================
    // GROUP B: PUNCH OUT SCENARIOS
    // ========================================================================
    test.describe("Punch Out Scenarios", () => {

        /**
         * State Reset Setup: Ensures the system is strictly in the "Punch Out" state.
         */
        test.beforeEach(async () => {
            await punchIOPage.mainTitle.waitFor({ state: 'visible' });
            const pageTitle = await punchIOPage.mainTitle.innerText();

            if (pageTitle === 'Punch In') {
                await punchIOPage.punchOut({date: '', time: ''});   // Uses default current time to punch out
                await punchIOPage.verifyMainTitle('Punch Out');
                await expect(punchIOPage.btnOut).toBeVisible();
            } else {
                await expect(punchIOPage.btnOut).toBeVisible();
            }
        });

        test("OrangeHRM_TIME_TC03_VerifyPunchOutMandatoryFields", async() => {
            const expectedRequiredError = expectedTexts.validationMessages.required

            await test.step("Action: Clear auto-filled fields and click 'Out'", async () => {
                await punchIOPage.punchOut({date: '', time: ''});
            });

            await test.step("Verfiy: System displays 'Required' error message for both fields", async () => {
                await punchIOPage.verifyFormValidationErrors({
                    date: expectedRequiredError,
                    time: expectedRequiredError
                });
            });
        });

        test("OrangeHRM_TIME_TC04_VerifyInvalidDayFormat", async() => {
            const invalidDate = timeData.invalidData.format.date;
            const validTime = timeData.validPunchOut.time;
            const expectedFormatError = expectedTexts.validationMessages.invalidDateFormat;

            await test.step("Action: Attempt to submit a date with an invalid format", async () => {
                await punchIOPage.punchOut({date: invalidDate, time: validTime}, false);
                await punchIOPage.btnOut.click();
            });

            await test.step("Verify: System displays an invalid format error for the Date field", async () => {
                await punchIOPage.verifyFormValidationErrors({date: expectedFormatError});
            });
        });

        test("OrangeHRM_TIME_TC05_VerifyAutoCorrectionOnInvalidTime", async() => {
            const validDate = timeData.validPunchOut.date;
            const invalidTime = timeData.invalidData.format.time;
            const expectedRequiredError = expectedTexts.validationMessages.required;

            test.step("Action: Input an invalid time format and trigger validation", async () => {
                await punchIOPage.punchOut({date: validDate, time: invalidTime}, false);
                await punchIOPage.btnOut.click();
            });

            test.step("Verify: System auto-clears the invalid time and flags it as required", async () => {
                await expect(punchIOPage.txtTime).toHaveValue('');
                await punchIOPage.verifyFormValidationErrors({time: expectedRequiredError});
            });
        });

        test("OrangeHRM_TIME_TC06_VerifyPunchOutTimeLessThanPunchInTime", async() => {
            const validDate = timeData.validPunchOut.date;
            const timeBeforeIn = timeData.invalidData.logic.timeBeforeIn;
            const expectedLogicError = expectedTexts.validationMessages.higherThanPunchIn;

            await test.step("Action: Attempt to punch out at a time BEFORE the punch in time", async () => {
                await punchIOPage.punchOut({date: validDate, time: timeBeforeIn}, false);
                await punchIOPage.btnOut.click();
            });
            
            await test.step("Verify: System rejects the input due to illogical timeline", async () => {
                await punchIOPage.verifyFormValidationErrors({time: expectedLogicError});
            });
        });

        test("OrangeHRM_TIME_TC07_VerifyPunchOutDateLessThanPunchInDate", async () => {
            const pastDate = timeData.invalidData.logic.pastDate;
            const validTime = timeData.validPunchOut.time;
            const expectedLogicError = expectedTexts.validationMessages.higherThanPunchIn;

            await test.step("Action: Attempt to punch out on a date BEFORE the punch in date", async () => {
                await punchIOPage.punchOut({date: pastDate, time: validTime}, false);
                await punchIOPage.btnOut.click();
            });

            await test.step("Verify: System rejects the input due to illogical timeline", async () => {
                await punchIOPage.verifyFormValidationErrors({date: expectedLogicError});
            });
        });

    })
})