/**
 * @fileoverview Custom Fixtures for the Add Employee module.
 * Handles automatic authentication and direct navigation to the target page.
 */

import { test as base } from '@playwright/test';
import { LoginPage } from '../../app/pages/login.page';
import { AddEmployeePage } from '../../app/pages/pim/add-employee.page';
import { ToastComponent } from '../../app/components/common/toast.component';
import usersData from '../../data/users.json';

// Declare the objects that will be injected into the tests
type AddEmployeeFixtures = {
    addEmployeePage: AddEmployeePage;
    toastComponent: ToastComponent;
};

// Extend the base Playwright test runner with custom fixtures
export const test = base.extend<AddEmployeeFixtures>({

    // Primary Fixture: Set up Authentication state and navigate to the target module
    addEmployeePage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        const addEmployeePage = new AddEmployeePage(page);

        // --- SETUP PHASE ---
        // 1. Authenticate into the system
        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);
        await page.waitForURL(/.*dashboard/);

        // 2. Navigate directly to the Add Employee Page to optimize execution time
        await page.goto('/web/index.php/pim/addEmployee');

        // --- EXECUTION PHASE ---
        // Yield the fully initialized and ready-to-use object to the Test Case
        await use(addEmployeePage);
    },

    // Secondary Fixture: Initialize the Toast Component 
    toastComponent: async ({ page }, use) => {
        await use(new ToastComponent(page));
    }
})

export { expect } from '@playwright/test';