/**
 * @fileoverview Playwright Custom Fixtures for the Login Module.
 * This fixture ensures a clean, unauthenticated state and navigates 
 * directly to the login page before yielding to the test.
 */

import { test as base } from '@playwright/test';
import { LoginPage } from '../app/pages/login.page';
import { DashboardPage } from '../app/pages/dashboard.page';


/**
 * Type definition for the custom fixtures available in the Login test suite.
 */
type LoginFixtures = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
};

// Extend the base test with our custom fixtures
export const test = base.extend<LoginFixtures>({
    /**
     * Fixture: loginPage
     * Initializes the Page Object, clears any previous state, and navigates 
     * directly to the Login page.
     */
    loginPage: async ({page}, use) => {
        const loginPage = new LoginPage(page);

        // --- Setup Phase ---
        // Ensure a clean slate by clearing cookies to prevent session bleed-over from other tests
        await page.context().clearCookies();

        // Navigate directly to the authentication portal
        await page.goto('/web/index.php/auth/login');

        // Wait for the login form to be fully rendered in the DOM before yielding control
        await loginPage.txtUsername.waitFor({state: 'visible'});

        // --- Execution Phase ---
        // Yield the fully initialized and ready-to-use loginPage instance to the test
        await use(loginPage);
    },

    /**
     * Fixture: dashboardPage
     * Initializes the Dashboard Page Object Model. This is primarily injected 
     * into test cases for post-login verification steps in successful authentication scenarios.
     */
    dashboardPage: async ({ page }, use) => {
        await use(new DashboardPage(page));
    }
});

export { expect } from '@playwright/test';