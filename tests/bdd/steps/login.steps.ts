import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Page } from 'playwright';

// Import Page Objects
import { LoginPage } from '../../../app/pages/login.page';
import { DashboardPage } from '../../../app/pages/dashboard.page';

// Import Data
import usersData from '../../../data/users.json';
import expectedTexts from '../../../data/expected-texts.json';

import { page, context } from '../support/hooks';

let page2: Page;

// ==========================================
// BACKGROUND & BASIC UI VALIDATION
// ==========================================

Given('I navigate to the OrangeHRM login page', async function () {
    const loginPage = new LoginPage(page);
    await page.goto('/web/index.php/auth/login');
    await loginPage.txtUsername.waitFor({state: 'visible'});
});

Then('the page title should be correct', async function () {
    await expect(page).toHaveTitle(expectedTexts.loginPage.pageTitle);
});

Then('the core UI components Username, Password, and Login Button should be visible', async function () {
    const loginPage = new LoginPage(page);
    await expect(loginPage.txtUsername).toBeVisible();
    await expect(loginPage.txtPassword).toBeVisible();
    await expect(loginPage.btnLogin).toBeVisible();
});

// ==========================================
// POSITIVE LOGIN SCENARIOS
// ==========================================

When('I login with valid username {string} and password {string}', async function (username, password) {
    const loginPage = new LoginPage(page);
    await loginPage.login(username, password);
});

Then('I should be securely redirected to Dashboard page', async function () {
    await expect(page).toHaveURL(/.*dashboard/);
});

Then('the Dashboard header should be visible', async function () {
    const dashboardPage = new DashboardPage(page);
    await expect(dashboardPage.labelHeader).toBeVisible();
});

// ==========================================
// SPECIAL FORM INTERACTION BEHAVIORS
// ==========================================


When('I fill the form with valid credentials', async function () {
    const loginPage = new LoginPage(page);
    const { username, password } = usersData.validAdmin;
    // Populate text fields but DO NOT trigger the login submission
    await loginPage.login(username, password, false);
});

When('I trigger the Enter keyboard event directly on the password input field', async function () {
    const loginPage = new LoginPage(page);
    await loginPage.txtPassword.press('Enter');
});

When('I submit valid credentials that contain leading and trailing whitespaces', async function () {
    const loginPage = new LoginPage(page);
    const { username, password } = usersData.whitespaceUsername;
    await loginPage.login(username, password);
});

Then('the system should automatically trim whitespaces and log me in successfully', async function () {
    const dashboardPage = new DashboardPage(page);
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(dashboardPage.labelHeader).toBeVisible();
});

When('I input text into the password field', async function () {
    const loginPage = new LoginPage(page);
    await loginPage.txtPassword.fill(usersData.validAdmin.password);
});

Then('the entered characters should be securely masked as a password type', async function () {
    const loginPage = new LoginPage(page);
    await expect(loginPage.txtPassword).toHaveAttribute('type', 'password');
});

When('I simulate a clipboard paste event with a secret text into the password field', async function () {
    const loginPage = new LoginPage(page);
    await loginPage.txtPassword.focus();
    await page.keyboard.insertText("PastedSecretPass123!");
});

Then('the system should accept the pasted input into the password field', async function () {
    const loginPage = new LoginPage(page);
    await expect(loginPage.txtPassword).toHaveValue("PastedSecretPass123!");
});

When('I input valid credentials but do not submit', async function () {
    const loginPage = new LoginPage(page);
    const { username, password } = usersData.validAdmin;
    await loginPage.login(username, password);
});

When('I simulate pressing the browser refresh button', async function () {
    await page.reload();
    const loginPage = new LoginPage(page);
    await loginPage.txtUsername.waitFor({ state: 'visible' });
});

Then('the Username and Password fields should be completely cleared', async function () {
    const loginPage = new LoginPage(page);
    await expect(loginPage.txtUsername).toBeEmpty();
    await expect(loginPage.txtPassword).toBeEmpty();
});

// ==========================================
// DATA-DRIVEN SCENARIOS (ERROR HANDLING & VALIDATION)
// ==========================================

When('I attempt to login with username {string} and password {string}', async function (username, password) {
    const loginPage = new LoginPage(page);
    // Receive data dynamically from the feature file (Scenario Outline Examples)
    await loginPage.login(username, password);
});

Then('the system should reject the login', async function () {
    await expect(page).not.toHaveURL(/.*dashboard/);
});

Then('display the corresponding error message {string}', async function (expectedMessage) {
    const loginPage = new LoginPage(page);
    
    // Handle error validation logic based on the Expected Error provided by the feature file
    if (expectedMessage === 'Required') {
        const expectedRequiredError = expectedTexts.loginPage.requiredFieldError;
        const userErrCount = await loginPage.msgUsernameRequired.count();
        const passErrCount = await loginPage.msgPasswordRequired.count();
        
        // At least one of the fields must display the "Required" error
        expect(userErrCount + passErrCount).toBeGreaterThan(0);
        
        if (userErrCount > 0) {
            await expect(loginPage.msgUsernameRequired).toHaveText(expectedRequiredError);
        }
        if (passErrCount > 0) {
            await expect(loginPage.msgPasswordRequired).toHaveText(expectedRequiredError);
        }
    } else {
        // Assert generic Invalid credentials error
        await loginPage.verifyInvalidCredentialsError(expectedMessage);
    }
});

// ==========================================
// SESSION & BROWSER ROUTING ACTIONS
// ==========================================

Given('I have successfully logged in and navigated to the Dashboard', async function () {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const { username, password } = usersData.validAdmin;
    
    await loginPage.login(username, password);
    await expect(dashboardPage.labelHeader).toBeVisible();
});

When('I simulate pressing the browser Back button', async function () {
    await page.goBack();
    await page.waitForLoadState('networkidle');
});

Then('the system should redirect back to the Dashboard denying access to the Login form', async function () {
    const dashboardPage = new DashboardPage(page);
    await expect(page).not.toHaveURL(/.*login/);
    await expect(dashboardPage.labelHeader).toBeVisible();
});

Given('I have opened the Login form on both Tab 1 and Tab 2', async function () {
    // Tab 1 is already opened in the Background step, proceed to initialize Tab 2
    page2 = await context.newPage();
    await page2.goto('/web/index.php/auth/login');
    const loginPageTab2 = new LoginPage(page2);
    await loginPageTab2.txtUsername.waitFor({ state: 'visible' });
});

When('I authenticate successfully on Tab 1', async function () {
    const loginPage = new LoginPage(page);
    const { username, password } = usersData.validAdmin;
    await loginPage.login(username, password);
});

When('I switch to Tab 2 and refresh the page', async function () {
    await page2.bringToFront();
    await page2.reload();
    await page2.waitForLoadState('networkidle');
});

Then('Tab 2 should automatically bypass the login form and route to the Dashboard', async function () {
    const dashboardPageTab2 = new DashboardPage(page2);
    await expect(page2).toHaveURL(/.*dashboard/);
    await expect(dashboardPageTab2.labelHeader).toBeVisible();
    await page2.close(); // Clean up Tab 2 after the assertion is complete
});

When('my session is terminated by clearing browser cookies', async function () {
    await context.clearCookies();
});

When('I attempt to navigate to a protected internal module like PIM', async function () {
    await page.goto('/web/index.php/pim/viewEmployeeList');
});

Then('the system should revoke access and redirect me to the Login interface', async function () {
    const loginPage = new LoginPage(page);
    await expect(page).toHaveURL(/.*login/);
    await expect(loginPage.btnLogin).toBeVisible();
});