/**
 * @fileoverview Playwright Custom Fixtures for the PIM Module.
 * This file extends the base Playwright test object by encapsulating 
 * Page Object instantiations and common pre-condition setups (e.g., authentication).
 * Using these fixtures keeps the test files clean, modular, and focused solely on assertions.
 */

import { test as base } from '@playwright/test';
import { LoginPage } from '../app/pages/login.page';
import { PimPage } from '../app/pages/pim/pim.page';
import { ToastComponent } from '../app/components/common/toast.component';
import { PimTopMenuComponent } from '../app/components/pim/pim-top-menu.component';
import usersData from '../data/users.json';


/**
 * Type definition for the custom fixtures available in the PIM test suite.
 * Declares the exact Page Object types that can be injected into the test cases.
 */
type PimFixtures = {
    pimPage: PimPage;
    pimTopMenu: PimTopMenuComponent;
    toastComponent: ToastComponent;
};

export const test = base.extend<PimFixtures>({

    /**
     * Fixture: pimPage
     * Automatically handles the prerequisite setup: Authentication and UI Synchronization.
     * Yields a fully initialized and ready-to-use PimPage object to the test.
     */
    pimPage: async ({page}, use) => {
        const loginPage = new LoginPage(page);
        const pimPage = new PimPage(page);

        // --- Setup Phase (Pre-conditions) ---
        // Navigate to the login portal and authenticate using valid admin credentials
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);

        // Wait for successful login redirect to the Dashboard
        await page.waitForURL('**/dashboard/index');

        // Navigate directly to the PIM Employee List page
        await page.goto('/web/index.php/pim/viewEmployeeList');

        // Synchronize UI State to ensure the data table and global loading spinners are fully resolved
        await pimPage.tableContainer.waitFor({state: 'visible'});
        await pimPage.waitForGlobalLoading();

        // --- Execution Phase ---
        // Yield the prepared pimPage instance to the test scope
        await use(pimPage);

        // --- Teardown Phase ---
    },


    /**
     * Fixture: pimTopMenu
     * Injects an initialized instance of the PimTopMenuComponent.
     */
    pimTopMenu: async ({page}, use) => {
        await use(new PimTopMenuComponent(page));
    },

    /**
     * Fixture: toastComponent
     * Injects an initialized instance of the ToastComponent for notification validations.
     */
    toastComponent: async ({page}, use) => {
        await use(new ToastComponent(page));
    }
});

// Re-export expect so test files can import both 'test' and 'expect' from this single fixture file
export { expect } from '@playwright/test';