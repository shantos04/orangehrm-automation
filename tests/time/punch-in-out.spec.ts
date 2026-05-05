import {test, expect} from '@playwright/test';

import {LoginPage} from '../../app/pages/login.page';
import {TimeTopMenuComponent} from '../../app/components/time/time-top-menu.component';
import {PunchInOutPage} from '../../app/pages/time/punch-in-out.page';
import {ToastComponent} from '../../app/components/common/toast.component';

import usersData from '../../data/users.json';
import expectedTexts from '../../data/expected-texts.json';

test.describe("Time Module - PunchIn/Out Page", () => {
    let loginPage: LoginPage;
    let timeTopMenu: TimeTopMenuComponent;
    let punchIOPage: PunchInOutPage;

    /**
     * Setup: Authentication and navigation to the Punch Out Page.
     */
    test.beforeEach(async ({page}) => {
        test.setTimeout(60000);

        loginPage = new LoginPage(page);
        timeTopMenu = new TimeTopMenuComponent(page);
        punchIOPage = new PunchInOutPage(page);

        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);

        await page.goto('/web/index.php/time/viewEmployeeTimesheet');
        await timeTopMenu.goToPunchInOut();
    })

    test.describe("Punch In Scenario", () => {
        test.beforeEach(async ({page}) => {
            const pageTitle = await punchIOPage.mainTitle.innerText();

            if (pageTitle === 'Punch Out') {
                await timeTopMenu.goToPunchInOut();
            }
        })
    })
})