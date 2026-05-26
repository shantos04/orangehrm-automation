/**
 * @fileoverview Playwright Custom Fixtures for the Time Module.
 */

import { test as base } from '@playwright/test';
import { LoginPage } from '../../app/pages/login.page';
import { TimeTopMenuComponent } from '../../app/components/time/time-top-menu.component';
import { PunchInOutPage } from '../../app/pages/time/punch-in-out.page';
import { CalendarComponent } from '../../app/components/common/calendar.component';
import usersData from '../../data/users.json';

type TimeFixtures = {
    loginPage: LoginPage;
    timeTopMenu: TimeTopMenuComponent;
    punchIOPage: PunchInOutPage;
    calendarComp: CalendarComponent;
};

export const test = base.extend<TimeFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    timeTopMenu: async ({ page }, use) => {
        await use(new TimeTopMenuComponent(page));
    },

    punchIOPage: async ({ page, loginPage, timeTopMenu }, use) => {
        page.setDefaultTimeout(60000);
        const punchIOPage = new PunchInOutPage(page);

        // Pre-condition: Login and navigate
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);
        await page.waitForURL('**/dashboard/index');

        await page.goto('/web/index.php/time/viewEmployeeTimesheet');
        await timeTopMenu.goToPunchInOut();

        // Wait for the main container to load
        await punchIOPage.mainTitle.waitFor({ state: 'visible' });

        await use(punchIOPage);
    },

    calendarComp: async ({ page, punchIOPage }, use) => {
        // Initialize the Calendar Component specifically for the first date wrapper (index 0).
        await use(new CalendarComponent(page, 0));
    }
});

export { expect } from '@playwright/test';