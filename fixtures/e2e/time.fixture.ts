/**
 * @fileoverview Playwright Custom Fixtures for the Time Module.
 */

import { test as base } from '@playwright/test';
import { LoginPage } from '../../app/pages/login.page';
import { TimeTopMenuComponent } from '../../app/components/time/time-top-menu.component';
import { PunchInOutPage } from '../../app/pages/time/punch-in-out.page';
import { CalendarComponent } from '../../app/components/common/calendar.component';
import { ToastComponent } from '../../app/components/common/toast.component'; // 👈 Thêm import Toast
import usersData from '../../data/users.json';

import * as allure from "allure-js-commons";
import path from 'path';

type TimeFixtures = {
    loginPage: LoginPage;
    timeTopMenu: TimeTopMenuComponent;
    punchIOPage: PunchInOutPage;
    calendarComp: CalendarComponent;
    toastComponent: ToastComponent; // 👈 Khai báo kiểu cho Toast
};

export const test = base.extend<TimeFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    timeTopMenu: async ({ page }, use) => {
        await use(new TimeTopMenuComponent(page));
    },

    toastComponent: async ({ page }, use) => { // 👈 Khởi tạo fixture cho Toast
        await use(new ToastComponent(page));
    },

    punchIOPage: async ({ page, loginPage, timeTopMenu }, use) => {
        page.setDefaultTimeout(60000);
        const punchIOPage = new PunchInOutPage(page);

        // Pre-condition: Tự động Login và Navigate
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);
        await page.waitForURL('**/dashboard/index');

        await page.goto('/web/index.php/time/viewEmployeeTimesheet');
        await timeTopMenu.goToPunchInOut();

        // Wait for the main container to load
        await punchIOPage.mainTitle.waitFor({ state: 'visible' });

        await use(punchIOPage);
    },

    // 💡 Dependency Injection Trick:
    // Việc truyền `punchIOPage` vào parameter sẽ ép Playwright phải chạy hàm setup của punchIOPage 
    // (tức là tự động Login & Navigate) TRƯỚC KHI khởi tạo CalendarComponent.
    calendarComp: async ({ page, punchIOPage }, use) => {
        // Initialize the Calendar Component specifically for the first date wrapper (index 0).
        await use(new CalendarComponent(page, 0));
    }
});

// 💡 Hook Global tự động render cây thư mục cho tab Packages trên Allure
test.beforeEach(async ({ }, testInfo) => {
    const relativePath = path.relative(testInfo.project.testDir, testInfo.file);
    const autoPackageName = relativePath
        .replace(/\.spec\.ts$/, '')
        .replace(/[\\/]/g, '.');

    await allure.label("package", autoPackageName);
});

export { expect } from '@playwright/test';