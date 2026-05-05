import {test, expect} from '@playwright/test';

import {LoginPage} from '../../app/pages/login.page';
import {TimeTopMenuComponent} from '../../app/components/time/time-top-menu.component';
import {PunchInOutPage} from '../../app/pages/time/punch-in-out.page';
import {ToastComponent} from '../../app/components/common/toast.component';

import usersData from '../../data/users.json';
import expectedTexts from '../../data/expected-texts.json';
import timeData from '../../data/time-data.json';

test.describe("Time Module - PunchIn/Out Page", () => {
    let loginPage: LoginPage;
    let timeTopMenu: TimeTopMenuComponent;
    let punchIOPage: PunchInOutPage;
    let toastComponent: ToastComponent;

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
                await punchIOPage.clickOutButton();
                
                // Verify the Heading have 'Punch In' text
                await expect(punchIOPage.mainTitle).toHaveText('Punch In');

                // Verify the UI is now ready for Punch In
                await expect(punchIOPage.btnIn).toBeVisible();
            } else {
                // Already in the correct state
                await expect(punchIOPage.btnIn).toBeVisible();
            }
        })

        test("OrangeHRM_TIME_TC01_VerifyPunchInMandatoryFields", async() => {
            // Clear auto-filled date and time fields to trigger validation
            await punchIOPage.submitPunchInForm('', '');

            await expect(punchIOPage.errorMessageDate).toHaveText(expectedTexts.validationMessages.required);
            await expect(punchIOPage.errorMessageTime).toHaveText(expectedTexts.validationMessages.required);
        });

        test("OrangeHRM_TIME_TC02_VerifySuccessfulPunchIn", async() => {
            // Retrieve valid Punch In data from JSON
            const {date, time, note} = timeData.validPunchIn;
            const expectedTextResult = expectedTexts.toastMessages.successSaved;

            await Promise.all([
                expect(toastComponent.toastMessage).toBeVisible(),
                punchIOPage.submitPunchInForm(date, time, note)
            ])

            await expect(toastComponent.toastMessage).toContainText(expectedTextResult);
            await expect(punchIOPage.btnOut).toBeVisible();
        });

    })

    // ========================================================================
    // GROUP B: PUNCH OUT SCENARIOS
    // ========================================================================
    test.describe("Punch Out Scenarios", () => {
        test.beforeEach(async () => {
            const pageTitle = await punchIOPage.mainTitle.innerText();

            if (pageTitle === 'Punch In') {
                await punchIOPage.clickInButton();

                // Verify the Heading have 'Punch Out' text
                await expect(punchIOPage.mainTitle).toHaveText('Punch Out');

                // Verify the UI is now ready for Punch Out
                await expect(punchIOPage.btnOut).toBeVisible();
            } else {
                await expect(punchIOPage.btnOut).toBeVisible();
            }
        })

        test("OrangeHRM_TIME_TC03_VerifyPunchOutMandatoryFields", async() => {
            await punchIOPage.submitPunchOutForm('', '');
            const expectedTextResult = expectedTexts.validationMessages.required

            await expect(punchIOPage.errorMessageDate).toHaveText(expectedTextResult);
            await expect(punchIOPage.errorMessageTime).toHaveText(expectedTextResult);
        })
    })
})