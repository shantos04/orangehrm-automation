/**
 * @fileoverview Test suite for the OrangeHRM Login Module.
 * This file contains automated test cases to verify the UI state, structure,
 * and business logic (authentication) of the login page using the Page Object Model.
 */

import { test, expect } from '@playwright/test';
import * as allure from "allure-js-commons";

import {LoginPage} from '../../app/pages/login.page';
import {DashboardPage} from '../../app/pages/dashboard.page';

import usersData from '../../data/users.json';
import expectedTexts from '../../data/expected-texts.json';
import loginTestScenarios from '../../data/login-scenarios.json';

/**
 * Test Suite: Authentication - Login Module
 * Focuses on verifying the Login flow and Data-Driven Testing.
 */
test.describe("Login Module - Authentication", () => {

    let loginPage: LoginPage;
    let dashboardPage: DashboardPage;

    /**
     * Setup: Initializes the page object and navigates to the login route.
     */
    test.beforeEach(async ({page}) => {
        // --- Allure Metadata ---
        await allure.epic("Authentication Module");
        await allure.feature("Login Functionality");

        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        await page.goto('/web/index.php/auth/login');
    });

    /**
     * Test Case: Verify basic UI elements on the login page.
     * Assertion Category: UI state (toBeVisible).
     */
    test("OrangeHRM_Login_TC01_VerifyUILoginPage", async({page}) => {
        await allure.story("UI Structure and Component Validation");
        await allure.severity("normal");

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
    // test("OrangeHRM_Login_TC02_VerifySuccessfulLogin", async({page}) => {
    //     const { username: testUsername, password: testPassword } = usersData.validAdmin;

    //     // Perform login action
    //     await loginPage.login(testUsername, testPassword);
    //     await expect(dashboardPage.labelHeader).toBeVisible();
    //     await expect(page).toHaveURL(/.*dashboard/);
    // });

    /**
     * Test Case: Verify error handling when using an invalid password.
     * Assertion: Checks for the visibility and content of the error message.
     */
    // test("OrangeHRM_Login_TC03_VerifyErrorInvalidPassword", async({page}) => {
    //     const { username: testUsername, password: testPassword } = usersData.invalidPassword;
    //     const expectedErrorMessage = expectedTexts.loginPage.invalidCredentialsError;

    //     await loginPage.login(testUsername, testPassword);

    //     await expect(loginPage.msgError).toBeVisible();
    //     await expect(loginPage.msgError).toHaveText(expectedErrorMessage);
    // });

    /**
     * Test Case: Verify validation errors when attempting to log in with empty fields.
     * Assertion: "Required" validation messages appear under both input fields.
     */
    // test("OrangeHRM_Login_TC04_VerifyErrorEmptyFields", async({page}) => {
    //     const {username: emptyUsername, password: emptyPassword} = usersData.emptyFields;
    //     const expectedErrorText = expectedTexts.loginPage.requiredFieldError;

    //     await loginPage.login(emptyUsername, emptyPassword);

    //     // Verify the exact validation message under the Username field
    //     await expect(loginPage.msgUsernameRequired).toBeVisible();
    //     await expect(loginPage.msgUsernameRequired).toHaveText(expectedErrorText);

    //     // Verify the exact validation message under the Password field
    //     await expect(loginPage.msgPasswordRequired).toBeVisible();
    //     await expect(loginPage.msgPasswordRequired).toHaveText(expectedErrorText);
    // });

    /**
     * Test Case: Verify the security masking of the password input field.
     * Assertion: The entered characters are masked (hidden as dots/asterisks).
     */
    test("OrangeHRM_Login_TC05_VerifyPasswordMasking", async({page}) => {
        await allure.story("Security - Password Field Masking");
        await allure.severity("critical");

        const testPassword = usersData.validAdmin.password;

        await test.step("Action: Input text into the password field", async () => {
            await loginPage.txtPassword.fill(testPassword);
        });
        
        await test.step("Verify: the 'type' attribute remains 'password' to ensure characters are masked", async () => {
            await expect(loginPage.txtPassword).toHaveAttribute('type', 'password');
        });
    });
    
    /**
     * Test Case: Verify the form submission using the Enter key on the keyboard.
     * Assertion: The form submits and navigates to the Dashboard page
     */
    test("OrangeHRM_Login_TC06_VerifyKeyboardEnterKey", async({page}) => {
        await allure.story("Accessibility - Keyboard Enter Key Submission");
        await allure.severity("normal");

        const {username: testUsername, password: testPassword} = usersData.validAdmin;

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

    /**
     * Test Case: Verify error handling when using an invalid username but correct password.
     * Assertion: Checks that the generic 'Invalid credentials' error is displayed to prevent user enumeration.
     */
    // test("OrangeHRM_Login_TC07_VerifyErrorInvalidUsername", async({page}) => {
    //     const {username: testUsername, password: testPassword} = usersData.invalidUsername;
    //     const expectedErrorMessage = expectedTexts.loginPage.invalidCredentialsError;

    //     await loginPage.login(testUsername, testPassword);
    //     // Verify the error message
    //     await expect(loginPage.msgError).toBeVisible();
    //     await expect(loginPage.msgError).toHaveText(expectedErrorMessage);
    // });

    /**
     * Test Case: Verify validation error when attempting to log in with an empty username field.
     * Assertion: UI state, Element Count, and Negative UI validation.
     */
    // test("OrangeHRM_Login_TC08_VerifyErrorEmptyUsername", async({page}) => {
    //     const {username: testUsername, password: testPassword} = usersData.emptyUsername;
    //     const expectedErrorMessage = expectedTexts.loginPage.requiredFieldError;

    //     // Perform the login action
    //     await loginPage.login(testUsername, testPassword);

    //     // Verify the 'Required' error message appears exactly once under the Username field
    //     await expect(loginPage.msgUsernameRequired).toHaveCount(1);
    //     await expect(loginPage.msgUsernameRequired).toBeVisible();
    //     await expect(loginPage.msgUsernameRequired).toHaveText(expectedErrorMessage);

    //     // Ensure that NO error message is displayed under the Password field
    //     await expect(loginPage.msgPasswordRequired).toBeHidden();
    // });

    /**
     * Test Case: Verify validation error when attempting to log in with an empty password field.
     * Assertion: UI state, Element Count, and Negative UI validation.
     */
    // test("OrangeHRM_Login_TC09_VerifyErrorEmptyPassword", async({page}) => {
    //     const {username: testUsername, password: testPassword} = usersData.emptyPassword;
    //     const expectedErrorMessage = expectedTexts.loginPage.requiredFieldError;

    //     // Perform the login action
    //     await loginPage.login(testUsername, testPassword);

    //     // Verify the 'Required' error message appears exactly once under the Password field
    //     await expect(loginPage.msgPasswordRequired).toHaveCount(1);
    //     await expect(loginPage.msgPasswordRequired).toBeVisible();
    //     await expect(loginPage.msgPasswordRequired).toHaveText(expectedErrorMessage);

    //     // Ensure that NO error message is displayed under the Username field
    //     await expect(loginPage.msgUsernameRequired).toBeHidden();
    // });

    /**
     * Test Case: Verify authentication behavior when valid credentials contain leading or trailing whitespaces.
     * Assertion: Validating Business logic and data value handling (verifying if the system automatically trims whitespaces).
     */
    // test("OrangeHRM_Login_TC10_VerifyWhitespaceHandling", async({page}) => {
    //     const {username: testUsername, password: testPassword} = usersData.whitespaceUsername;
        
    //     await loginPage.login(testUsername, testPassword);
        
    //     await expect(dashboardPage.labelHeader).toBeVisible();
    //     await expect(page).toHaveURL(/.*dashboard/);
    // });


    /**
     * Data-Driven Execution Block
     * Iterates over the defined scenarios in JSON to perform various login attempts.
     */
    for (const scenario of loginTestScenarios) {
        test(`${scenario.testCaseId}`, async({page}) => {
        
            switch (scenario.expectedResult) {
                case "success":
                    await allure.story("Positive - Valid Login Scenario");
                    await allure.severity("blocker"); 
                    break;
                case "invalid_credentials":
                    await allure.story("Negative - Invalid Credentials Handling");
                    await allure.severity("critical");
                    break;
                case "empty_both":
                case "empty_username":
                case "empty_password":
                    await allure.story("Negative - Empty Fields Validation");
                    await allure.severity("normal");
                    break;
                default:
                    await allure.story("Authentication Scenario");
                    await allure.severity("normal");
            }
            
            await test.step(`Action: Perform login with Scenario - ${scenario.expectedResult}`, async () => {
                await loginPage.login(scenario.username, scenario.password);
            });

            await test.step(`Verify: Assert the expected result (${scenario.expectedResult})`, async () => {
                // Pre-fetch expected text from JSON to use in verifications
                const expectedRequiredError = expectedTexts.loginPage.requiredFieldError;
                const expectedInvalidError = expectedTexts.loginPage.invalidCredentialsError;

                switch (scenario.expectedResult) {
                    case "success":
                        await expect(dashboardPage.labelHeader).toBeVisible();
                        await expect(page).toHaveURL(/.*dashboard/);
                        break;

                    case "invalid_credentials":
                        await loginPage.verifyInvalidCredentialsError(expectedInvalidError);
                        break;

                    case "empty_both":
                        await loginPage.verifyRequiredFieldErrors({
                            username: expectedRequiredError,
                            password: expectedRequiredError
                        });
                        break;

                    case "empty_username":
                        // Check exact count to ensure password field does NOT show error
                        await expect(loginPage.msgUsernameRequired).toHaveCount(1);
                        await expect(loginPage.msgPasswordRequired).toBeHidden();
                        
                        await loginPage.verifyRequiredFieldErrors({
                            username: expectedRequiredError
                        });
                        break;

                    case "empty_password":
                        // Check exact count to ensure username field does NOT show error
                        await expect(loginPage.msgPasswordRequired).toHaveCount(1);
                        await expect(loginPage.msgUsernameRequired).toBeHidden();
                        
                        await loginPage.verifyRequiredFieldErrors({
                            password: expectedRequiredError
                        });
                        break;
                        
                    default:
                        throw new Error(`Unknown expected result defined in test data: ${scenario.expectedResult}`);
                }
            });
        });
    };

    /**
     * Test Case: Verify form data is cleared upon page refresh.
     * Assertion: Ensures sensitive data does not persist in DOM/cache after a reload.
     */
    test("OrangeHRM_Login_TC11_VerifyFormReload", async ({page}) => {
        await allure.story("Browser Action - Form Reload Protection");
        await allure.severity("normal");

        const { username: validUser, password: validPass} = usersData.validAdmin;

        await test.step("Action: Input valid credentials but do NOT submit", async () => {
            await loginPage.login(validUser, validPass, false);
        });

        await test.step("Action: Simulate user pressing F5 (Refresh)", async () => {
            await page.reload();
            await loginPage.txtUsername.waitFor({state: 'visible'});
        });

        await test.step("Verify: Username and Password fields are completely cleared", async () => {
            await expect(loginPage.txtUsername).toBeEmpty();
            await expect(loginPage.txtUsername).toBeEmpty();
        });
    });

    /**
     * Test Case: Verify system prevents returning to Login page via Back button after successful authentication.
     * Assertion: Session validation ensures users are forced back to the secure Dashboard.
     */
    test("OrangeHRM_Login_TC12_VerifyBrowserBackButton", async ({page}) => {
        await allure.story("Browser Actions - Back Button Session Handling");
        await allure.severity("critical");

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
    test("OrangeHRM_Login_TC13_VerifyMultipleTabsLogin", async ({context, page}) => {
        await allure.story("Browser Actions - Cross-Tab Session Synchronization");
        await allure.severity("critical");

        const { username: validUser, password: validPass } = usersData.validAdmin;

        // Initialize a second tab within the same browser context
        const page2 = await context.newPage();
        const loginPageTab2 = new LoginPage(page2);

        await test.step("Action: Open Login form on both Tab 1 and Tab 2", async () => {
            await page2.goto('/web/index.php/auth/login');
            await loginPageTab2.txtUsername.waitFor({state: 'visible'});
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
            const dashboardPageTab2 = new DashboardPage(page2);
            await expect(page2).toHaveURL(/.*dashboard/);
            await expect(dashboardPageTab2.labelHeader).toBeVisible();
        });
    });

    /**
     * Test Case: Verify strict case sensitivity for password validation.
     * Assertion: Capitalizing a valid password should trigger an Invalid Credentials error.
     */
    test("OrangeHRM_Login_TC14_VerifyCaseSensitivity", async () => {
        await allure.story("Security - Strict Case Sensitivity Validation");
        await allure.severity("critical");

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
    test("OrangeHRM_Login_TC15_VerifySqlInjectionBypass", async () => {
        await allure.story("Security - SQL Injection Mitigation");
        await allure.severity("blocker");

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
     * Test Case: Verify standard clipboard paste operations on the password field.
     * Assertion: Validates if the project requirements permit or restrict pasting into sensitive fields.
     */
    test("OrangeHRM_Login_TC16_VerifyCopyPasteFunctionality", async ({page}) => {
        await allure.story("Security - Clipboard Interaction (Paste)");
        await allure.severity("minor");

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

    /**
     * Test Case: Verify forceful session termination triggers immediate re-authentication.
     * Assertion: Simulates a session timeout (cookie deletion) and attempts to access protected routes.
     */
    test("OrangeHRM_Login_TC17_VerifySessionTimeout", async ({ context, page }) => {
        await allure.story("Security - Session Timeout Enforcement");
        await allure.severity("blocker");

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