/**
 * @fileoverview Test suite for the OrangeHRM Login Module.
 * This file contains automated test cases to verify the UI state, structure,
 * and business logic (authentication) of the login page using the Page Object Model.
 */

import { test, expect } from '../../../fixtures/login.fixture';
import * as allure from "allure-js-commons";

import usersData from '../../../data/users.json';
import expectedTexts from '../../../data/expected-texts.json';
import loginTestScenarios from '../../../data/login-scenarios.json';

// ============================================================================
// SUITE 1: BASIC UI & POSITIVE SMOKE FLOWS
// ============================================================================
test.describe("Login Module - UI & Positive Flows @PositiveGroup", () => {

    /**
     * Setup: Initializes the page object and navigates to the login route.
     */
    test.beforeEach(async () => {
        // --- Allure Metadata ---
        await allure.epic("Authentication Module");
        await allure.feature("Login Functionality");
    });

    /**
     * Test Case: Verify basic UI elements on the login page.
     * Assertion Category: UI state (toBeVisible).
     */
    test("OrangeHRM_Login_TC01_VerifyUILoginPage @UI", async ({ page, loginPage }) => {
        await allure.story("UI Structure and Component Validation");
        await allure.severity("low");

        const expectedTitle = expectedTexts.loginPage.pageTitle;

        await test.step("Verify: Page Title is Correct", async () => {
            await expect(page).toHaveTitle(expectedTitle);
        })

        await test.step("Verify: Core UI components (Username, Password, Login Button) are visible", async () => {
            await expect(loginPage.txtUsername).toBeVisible();
            await expect(loginPage.txtPassword).toBeVisible();
            await expect(loginPage.btnLogin).toBeVisible();
        })
    });

    /**
     * Test Case: Verify successful login with valid administrative credentials.
     * Assertion: Checks if the user is redirected and the 'Dashboard' header is visible.
     */
    test("OrangeHRM_Login_TC02_VerifySuccessfulLogin @Smoke @HappyPath", async ({ page, loginPage, dashboardPage }) => {
        await allure.story("Positive - Valid Login Scenario");
        await allure.severity("critical");

        const { username: validUser, password: validPass } = usersData.validAdmin;

        await test.step("Action: Perform login with valid credentials", async () => {
            await loginPage.login(validUser, validPass);
        });

        await test.step("Verify: Dashboard is accessible and header is visible", async () => {
            await expect(dashboardPage.labelHeader).toBeVisible();
            await expect(page).toHaveURL(/.*dashboard/);
        });
    });

    /**
     * Test Case: Verify the form submission using the Enter key on the keyboard.
     * Assertion: The form submits and navigates to the Dashboard page
     */
    test("OrangeHRM_Login_TC06_VerifyKeyboardEnterKey @HappyPath", async ({ page, loginPage, dashboardPage }) => {
        await allure.story("Accessibility - Keyboard Enter Key Submission");
        await allure.severity("low");

        const { username: testUsername, password: testPassword } = usersData.validAdmin;

        await test.step("Action: Fill the form but strictly instruct not to click the login button", async () => {
            await loginPage.login(testUsername, testPassword, false);
        });

        await test.step("Action: Trigger the Enter keyboard even directly on the password input field", async () => {
            await loginPage.txtPassword.press('Enter');
        })

        await test.step("Verify: Successful routing to the Dashboard", async () => {
            await expect(dashboardPage.labelHeader).toBeVisible();
            await expect(page).toHaveURL(/.*dashboard/);
        })
    });
});

// ============================================================================
// SUITE 2: FORM VALIDATION & NEGATIVE FLOWS
// ============================================================================
test.describe("Login Module - Form Validation & Negative Flows @NegativeGroup", () => {

    test.beforeEach(async () => {
        // --- Allure Metadata ---
        await allure.epic("Authentication Module");
        await allure.feature("Login Functionality");
    });

    /**
     * Test Case: Verify error handling when using invalid credentials.
     * Assertion: Checks for the visibility and content of the generic error message.
     */
    test("OrangeHRM_Login_TC03_VerifyInvalidCredentials @Smoke @Negative", async ({ loginPage }) => {
        await allure.story("Negative - Invalid Credentials Handling");
        await allure.severity("high");

        const { username: invalidUser, password: invalidPass } = usersData.invalidPassword;
        const expectedInvalidError = expectedTexts.loginPage.invalidCredentialsError;

        await test.step("Action: Perform login with invalid credentials", async () => {
            await loginPage.login(invalidUser, invalidPass);
        });

        await test.step("Verify: System displays 'Invalid credentials' error", async () => {
            await loginPage.verifyInvalidCredentialsError(expectedInvalidError);
        });
    });

    /**
     * Test Case: Verify validation errors when attempting to log in with both fields empty.
     * Assertion: "Required" validation messages appear under both input fields.
     */
    test("OrangeHRM_Login_TC04_VerifyEmptyBothFields @Negative", async ({ loginPage }) => {
        await allure.story("Negative - Empty Fields Validation");
        await allure.severity("medium");

        const { username: emptyUser, password: emptyPass } = usersData.emptyFields;
        const expectedRequiredError = expectedTexts.loginPage.requiredFieldError;

        await test.step("Action: Submit the form without entering any data", async () => {
            await loginPage.login(emptyUser, emptyPass);
        });

        await test.step("Verify: 'Required' error messages appear under both fields", async () => {
            await loginPage.verifyRequiredFieldErrors({
                username: expectedRequiredError,
                password: expectedRequiredError
            });
        });
    });

    /**
     * Test Case: Verify error handling when using an invalid username but correct password.
     * Assertion: Checks that the generic 'Invalid credentials' error is displayed to prevent user enumeration.
     */
    test("OrangeHRM_Login_TC07_VerifyErrorInvalidUsername @Negative", async ({ loginPage }) => {
        await allure.story("Negative - Invalid Credentials Handling");
        await allure.severity("high");

        const { username: invalidUser, password: validPass } = usersData.invalidUsername;
        const expectedInvalidError = expectedTexts.loginPage.invalidCredentialsError;

        await test.step("Action: Perform login with invalid username", async () => {
            await loginPage.login(invalidUser, validPass);
        });

        await test.step("Verify: System displays 'Invalid credentials' error", async () => {
            await loginPage.verifyInvalidCredentialsError(expectedInvalidError);
        });
    });

    /**
     * Test Case: Verify validation error when attempting to log in with an empty username field.
     * Assertion: UI state, Element Count, and Negative UI validation.
     */
    test("OrangeHRM_Login_TC08_VerifyErrorEmptyUsername @Negative", async ({ loginPage }) => {
        await allure.story("Negative - Empty Fields Validation");
        await allure.severity("medium");

        const { username: emptyUser, password: validPass } = usersData.emptyUsername;
        const expectedRequiredError = expectedTexts.loginPage.requiredFieldError;

        await test.step("Action: Submit the form with an empty username", async () => {
            await loginPage.login(emptyUser, validPass);
        });

        await test.step("Verify: 'Required' error message appears exactly once under the Username field", async () => {
            await expect(loginPage.msgUsernameRequired).toHaveCount(1);
            await expect(loginPage.msgPasswordRequired).toBeHidden();

            await loginPage.verifyRequiredFieldErrors({
                username: expectedRequiredError
            });
        });
    });

    /**
     * Test Case: Verify validation error when attempting to log in with an empty password field.
     * Assertion: UI state, Element Count, and Negative UI validation.
     */
    test("OrangeHRM_Login_TC09_VerifyErrorEmptyPassword @Negative", async ({ loginPage }) => {
        await allure.story("Negative - Empty Fields Validation");
        await allure.severity("medium");

        const { username: validUser, password: emptyPass } = usersData.emptyPassword;
        const expectedRequiredError = expectedTexts.loginPage.requiredFieldError;

        await test.step("Action: Submit the form with an empty password", async () => {
            await loginPage.login(validUser, emptyPass);
        });

        await test.step("Verify: 'Required' error message appears exactly once under the Password field", async () => {
            await expect(loginPage.msgPasswordRequired).toHaveCount(1);
            await expect(loginPage.msgUsernameRequired).toBeHidden();

            await loginPage.verifyRequiredFieldErrors({
                password: expectedRequiredError
            });
        });
    });
});

// ============================================================================
// SUITE 3: EDGE CASES & DATA HANDLING
// ============================================================================
test.describe("Login Module - Edge Cases & Data Handling @EdgeCaseGroup", () => {

    test.beforeEach(async () => {
        // --- Allure Metadata ---
        await allure.epic("Authentication Module");
        await allure.feature("Login Functionality");
    });

    /**
     * Test Case: Verify authentication behavior when valid credentials contain leading or trailing whitespaces.
     * Assertion: Validating Business logic and data value handling (verifying if the system automatically trims whitespaces).
     */
    test("OrangeHRM_Login_TC10_VerifyWhitespaceHandling @HappyPath @EdgeCase", async ({ page, loginPage, dashboardPage }) => {
        await allure.story("Positive - Data Sanitization (Whitespace Handling)");
        await allure.severity("medium");

        const { username: whitespaceUser, password: validPass } = usersData.whitespaceUsername;

        await test.step("Action: Submit credentials containing leading/trailing whitespaces", async () => {
            await loginPage.login(whitespaceUser, validPass);
        });

        await test.step("Verify: System automatically trims whitespaces and logs in successfully", async () => {
            await expect(dashboardPage.labelHeader).toBeVisible();
            await expect(page).toHaveURL(/.*dashboard/);
        });
    });

    /**
     * Test Case: Verify form data is cleared upon page refresh.
     * Assertion: Ensures sensitive data does not persist in DOM/cache after a reload.
     */
    test("OrangeHRM_Login_TC11_VerifyFormReload @EdgeCase", async ({ page, loginPage }) => {
        await allure.story("Browser Action - Form Reload Protection");
        await allure.severity("low");

        const { username: validUser, password: validPass } = usersData.validAdmin;

        await test.step("Action: Input valid credentials but do NOT submit", async () => {
            await loginPage.login(validUser, validPass, false);
        });

        await test.step("Action: Simulate user pressing F5 (Refresh)", async () => {
            await page.reload();
            await loginPage.txtUsername.waitFor({ state: 'visible' });
        });

        await test.step("Verify: Username and Password fields are completely cleared", async () => {
            await expect(loginPage.txtUsername).toBeEmpty();
            await expect(loginPage.txtUsername).toBeEmpty();
        });
    });

    /**
     * Test Case: Verify standard clipboard paste operations on the password field.
     * Assertion: Validates if the project requirements permit or restrict pasting into sensitive fields.
     */
    test("OrangeHRM_Login_TC16_VerifyCopyPasteFunctionality @EdgeCase", async ({ page, loginPage }) => {
        await allure.story("Security - Clipboard Interaction (Paste)");
        await allure.severity("low");

        const secretText = "PastedSecretPass123!"

        await test.step("Action: Simulate a clipboard paste event into the password field", async () => {
            // Focus the element and simulate rapid text insertion akin to Ctrl+V
            await loginPage.txtPassword.focus();
            await page.keyboard.insertText(secretText);
        });

        await test.step("Verify: The system accepts pasted input into the password field", async () => {
            await expect(loginPage.txtPassword).toHaveText(secretText);
        });
    });
});

// ============================================================================
// SUITE 4: SECURITY & SESSION MANAGEMENT
// ============================================================================
test.describe("Login Module - Security & Session Management @SecurityGroup", () => {

    test.beforeEach(async () => {
        // --- Allure Metadata ---
        await allure.epic("Authentication Module");
        await allure.feature("Login Functionality");
    });

    /**
     * Test Case: Verify the security masking of the password input field.
     * Assertion: The entered characters are masked (hidden as dots/asterisks).
     */
    test("OrangeHRM_Login_TC05_VerifyPasswordMasking @Security @UI", async ({ loginPage }) => {
        await allure.story("Security - Password Field Masking");
        await allure.severity("medium");

        const testPassword = usersData.validAdmin.password;

        await test.step("Action: Input text into the password field", async () => {
            await loginPage.txtPassword.fill(testPassword);
        });

        await test.step("Verify: the 'type' attribute remains 'password' to ensure characters are masked", async () => {
            await expect(loginPage.txtPassword).toHaveAttribute('type', 'password');
        });
    });

    /**
     * Test Case: Verify system prevents returning to Login page via Back button after successful authentication.
     * Assertion: Session validation ensures users are forced back to the secure Dashboard.
     */
    test("OrangeHRM_Login_TC12_VerifyBrowserBackButton @Security @Session", async ({ page, loginPage, dashboardPage }) => {
        await allure.story("Browser Actions - Back Button Session Handling");
        await allure.severity("high");

        const { username: validUser, password: validPass } = usersData.validAdmin;

        await test.step("Action: Authenticate successfully and navigate to Dashboard", async () => {
            await loginPage.login(validUser, validPass);
            await expect(dashboardPage.labelHeader).toBeVisible();
        });

        await test.step("Action: Simulate user pressing the browser's Back button", async () => {
            await page.goBack();
            await page.waitForLoadState('networkidle');
        });

        await test.step("Verify: System redirects back to Dashboard, denying access to Login form", async () => {
            await expect(page).not.toHaveURL(/.*login/);
            await expect(dashboardPage.labelHeader).toBeVisible();
        });
    });

    /**
     * Test Case: Verify session persistence across multiple browser tabs.
     * Assertion: Ensures logging in on Tab 1 automatically authorizes Tab 2 upon reload.
     */
    test("OrangeHRM_Login_TC13_VerifyMultipleTabsLogin @Security @Session", async ({ context, loginPage, dashboardPage }) => {
        await allure.story("Browser Actions - Cross-Tab Session Synchronization");
        await allure.severity("high");

        const { username: validUser, password: validPass } = usersData.validAdmin;

        // Initialize a second tab within the same browser context
        const page2 = await context.newPage();
        const LoginPageClass = loginPage.constructor as new (page: typeof page2) => typeof loginPage;
        const loginPageTab2 = new LoginPageClass(page2);

        await test.step("Action: Open Login form on both Tab 1 and Tab 2", async () => {
            await page2.goto('/web/index.php/auth/login');
            await loginPageTab2.txtUsername.waitFor({ state: 'visible' });
        });

        await test.step("Action: Authenticate successfully on Tab 1", async () => {
            await loginPage.login(validUser, validPass);
            await expect(dashboardPage.labelHeader).toBeVisible();
        });

        await test.step("Action: Switch to Tab 2 and refresh the page", async () => {
            await page2.bringToFront();
            await page2.reload();
            await page2.waitForLoadState('networkidle');
        });

        await test.step("Verify: Tab 2 automatically bypasses and routes to Dashboard", async () => {
            const DashboardPageClass = dashboardPage.constructor as new (page: typeof page2) => typeof dashboardPage;
            const dashboardPageTab2 = new DashboardPageClass(page2);
            await expect(page2).toHaveURL(/.*dashboard/);
            await expect(dashboardPageTab2.labelHeader).toBeVisible();
        });
    });

    /**
     * Test Case: Verify strict case sensitivity for password validation.
     * Assertion: Capitalizing a valid password should trigger an Invalid Credentials error.
     */
    test("OrangeHRM_Login_TC14_VerifyCaseSensitivity @Negative @Security", async ({ loginPage }) => {
        await allure.story("Security - Strict Case Sensitivity Validation");
        await allure.severity("high");

        const validUser = usersData.validAdmin.username;
        const uppercasePass = usersData.validAdmin.password.toUpperCase();
        const expectedInvalidError = expectedTexts.loginPage.invalidCredentialsError;

        await test.step("Action: Attempt login with an intentionally uppercase password", async () => {
            await loginPage.login(validUser, uppercasePass);
        });

        await test.step("Verify: System rejects the altered password format", async () => {
            await loginPage.verifyInvalidCredentialsError(expectedInvalidError);
        });
    });

    /**
     * Test Case: Verify form vulnerability against basic SQL Injection attacks.
     * Assertion: Inputs should be sanitized, preventing unauthorized bypass.
     */
    test("OrangeHRM_Login_TC15_VerifySqlInjectionBypass @Negative @Security", async ({ loginPage }) => {
        await allure.story("Security - SQL Injection Mitigation");
        await allure.severity("critical");

        const sqlPayload = "' OR '1'='1";
        const expectedInvalidError = expectedTexts.loginPage.invalidCredentialsError;

        await test.step("Action: Inject SQL payload into both input fields and submit", async () => {
            await loginPage.login(sqlPayload, sqlPayload);
        });

        await test.step("Verify: System sanitizes input, does not crash, and denies access", async () => {
            await loginPage.verifyInvalidCredentialsError(expectedInvalidError);
        });
    });

    /**
     * Test Case: Verify forceful session termination triggers immediate re-authentication.
     * Assertion: Simulates a session timeout (cookie deletion) and attempts to access protected routes.
     */
    test("OrangeHRM_Login_TC17_VerifySessionTimeout @Security @Session", async ({ context, page, loginPage, dashboardPage }) => {
        await allure.story("Security - Session Timeout Enforcement");
        await allure.severity("critical");

        const { username: validUser, password: validPass } = usersData.validAdmin;

        await test.step("Action: Authenticate successfully and establish a session", async () => {
            await loginPage.login(validUser, validPass);
            await expect(dashboardPage.labelHeader).toBeVisible();
        });

        await test.step("Action: Terminate session by clearing browser cookies", async () => {
            await context.clearCookies();
        });

        await test.step("Action: Attempt to navigate to a protected internal module (PIM)", async () => {
            await page.goto('/web/index.php/pim/viewEmployeeList');
        });

        await test.step("Verify: System revokes access and redirects to Login interface", async () => {
            await expect(page).toHaveURL(/.*login/);
            await expect(loginPage.btnLogin).toBeVisible();
        });
    });
});