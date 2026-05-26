import { test, expect } from '../../../fixtures/auth.fixture';
import * as allure from 'allure-js-commons';

import authData from '../../../data/auth-data.json';

test.describe('API Testing - OrangeHRM Real Authentication', () => {

    // Initialize the API helper with both request and page fixtures to enable hybrid testing
    test.beforeEach(async () => {
        await allure.epic("API Login Testing");
        await allure.feature("Authentication Module");
    });

    /**
     * Test Case: Verify successful authentication with valid credentials.
     * Assertion: Validates that the server responds with a 302 status code and the Location header redirects to the Dashboard.
     * Edge Case Handled: Confirms the happy path integration between CSRF token generation and session cookie validation.
     */
    test('TC01: Valid credentials should redirect to Dashboard (302)', async ({ authAPI }) => {
        await allure.epic("Positive - Valid Login");
        await allure.severity("blocker");

        const response = await test.step("Action: Submit valid credentials via API", async () => {
            return await authAPI.loginViaAPI(authData.validAccount.username, authData.validAccount.password);
        });

        await test.step("Verify: Server responds with 302 and redirects to the Dashboard", async () => {
            await authAPI.verifyRedirectToDashboard(response);
        })
    });

    /**
     * Test Case: Verify authentication failure when an incorrect password is provided.
     * Assertion: Ensures the system rejects the request (302 status) and redirects the user back to the Login page.
     */
    test('TC02: Invalid password should redirect back to Login (302)', async ({ authAPI }) => {
        await allure.story("Negative - Invalid Password");
        await allure.severity("critical");

        const response = await test.step("Action: Submit correct username but wrong password", async () => {
            return await authAPI.loginViaAPI(authData.validAccount.username, authData.invalidAccount.wrongPassword);
        });

        await test.step("Verify: Server rejects login and redirects back to the Login page", async () => {
            await authAPI.verifyRedirectToLogin(response);
        });
    });

    /**
     * Test Case: Verify authentication behavior when both username and password fields are left empty.
     * Assertion: Validates that the server catches the missing parameters, returns a 302 status, and redirects back to the Login page.
     */
    test('TC03: Empty fields should redirect back to Login', async ({ authAPI }) => {
        await allure.story("Negative - Empty Form Submission");
        await allure.severity("normal");

        const response = await test.step("Action: Submit entirely empty form data", async () => {
            return await authAPI.loginViaAPI('', '');
        });

        await test.step("Verify: Server rejects login and redirects back to the Login page", async () => {
            await authAPI.verifyRedirectToLogin(response);
        });
    });

    /**
     * Test Case: Verify authentication behavior with a valid username but an empty password.
     * Assertion: Ensures partial data submission is rejected, returning a 302 status and redirecting to the Login page.
     * Edge Case Handled: Tests server-side validation specifically for missing mandatory password fields.
     */
    test('TC04: Valid username but empty password should redirect back to Login', async ({ authAPI }) => {
        await allure.story("Negative - Missing Password");
        await allure.severity("normal");

        const response = await test.step("Action: Submit missing password", async () => {
            return await authAPI.loginViaAPI(authData.validAccount.username, '');
        });

        await test.step("Verify: Server rejects login and redirects back to the Login page", async () => {
            await authAPI.verifyRedirectToLogin(response);
        });
    });

    /**
     * Test Case: Verify authentication behavior with an empty username but a valid password.
     * Assertion: Ensures partial data submission is rejected, returning a 302 status and redirecting to the Login page.
     */
    test('TC05: Empty username but valid password should redirect back to Login', async ({ authAPI }) => {
        await allure.story("Negative - Missing Username");
        await allure.severity("normal");

        const response = await test.step("Action: Submit missing username", async () => {
            return await authAPI.loginViaAPI('', authData.validAccount.password);
        });

        await test.step("Verify: Server rejects login and redirects back to the Login page", async () => {
            await authAPI.verifyRedirectToLogin(response);
        });
    });

    /**
     * Test Case: Verify authentication failure when attempting to log in with an unregistered username.
     * Assertion: Validates that non-existent users are rejected (302 status) and redirected back to the Login page.
     * Edge Case Handled: Ensures the system does not leak user existence information (handles it identically to an invalid password).
     */
    test('TC06: Unregistered username should redirect back to Login', async ({ authAPI }) => {
        await allure.story("Negative - Unregistered User");
        await allure.severity("major");

        const response = await test.step("Action: Submit a username that does not exist in the database", async () => {
            return await authAPI.loginViaAPI(authData.invalidAccount.unregisteredUsername, authData.validAccount.password);
        });

        await test.step("Verify: Server rejects login and redirects back to the Login page", async () => {
            await authAPI.verifyRedirectToLogin(response);
        });
    });

    /**
     * Test Case: Verify system resilience against basic SQL Injection attempts in the username field.
     * Assertion: Ensures the malicious payload is safely handled, returning a 302 redirect to the Login page rather than a 500 server crash.
     * Edge Case Handled: Validates backend input sanitization and query parameterization when bypassing the frontend.
     */
    test('TC07: SQL Injection attempt in username should be handled gracefully (302)', async ({ authAPI }) => {
        await allure.story("Security - SQL Injection Prevention");
        await allure.severity("critical");

        const response = await test.step("Action: Inject a classic boolean-based SQL payload", async () => {
            return await authAPI.loginViaAPI(authData.securityPayloads.sqlInjection, authData.validAccount.password);
        });

        await test.step("Verify: Server does not crash and safely redirects back to Login page", async () => {
            await authAPI.verifyRedirectToLogin(response);
        });
    });

    /**
     * Test Case: Verify system resilience against Cross-Site Scripting (XSS) payloads in the username field.
     * Assertion: Ensures the script payload is blocked or sanitized, returning a safe 302 redirect back to the Login page.
     * Edge Case Handled: Confirms that frontend-bypassing malicious scripts do not execute or break the backend router.
     */
    test('TC08: XSS Payload attempt in username should be blocked', async ({ authAPI }) => {
        await allure.story("Security - XSS Prevention");
        await allure.severity("critical");

        const response = await test.step("Action: Inject a basic Javascript alert payload", async () => {
            return await authAPI.loginViaAPI(authData.securityPayloads.xss, authData.validAccount.password);
        });

        await test.step("Verify: Server blocks the script and safely redireccts back to Login", async () => {
            await authAPI.verifyRedirectToLogin(response);
        });
    });

    /**
     * Test Case: Verify system stability when processing excessively long input strings (Buffer Overflow prevention).
     * Assertion: Ensures that a 255-character string is rejected gracefully with a 302 redirect rather than causing an internal server error.
     * Edge Case Handled: Tests database column length constraints and memory limit handling during authentication.
     */
    test('TC09: Extremely long inputs should not cause server crash', async ({ authAPI }) => {
        await allure.story("Security - Buffer Overflow Prevention");
        await allure.severity("minor");

        const response = await test.step("Action: Generate and submit an oversized string based in JSON config", async () => {
            const longString = authData.securityPayloads.bufferOverflowChar.repeat(authData.securityPayloads.bufferOverflowLength);
            return await authAPI.loginViaAPI(longString, authData.validAccount.password);
        });

        await test.step("Verify: Server processes the oversized input without crashing and redirects to Login", async () => {
            await authAPI.verifyRedirectToLogin(response);
        });
    });
});