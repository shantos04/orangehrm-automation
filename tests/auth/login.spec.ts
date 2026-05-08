/**
 * @fileoverview Test suite for the OrangeHRM Login Module.
 * This file contains automated test cases to verify the UI state, structure,
 * and business logic (authentication) of the login page using the Page Object Model.
 */

import { test, expect } from '@playwright/test';
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
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        await page.goto('/web/index.php/auth/login');
    });

    /**
     * Test Case: Verify basic UI elements on the login page.
     * Assertion Category: UI state (toBeVisible).
     */
    test("OrangeHRM_Login_TC01_VerifyUILoginPage", async({page}) => {
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
    }
});