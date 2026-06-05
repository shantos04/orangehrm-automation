/**
 * @fileoverview API Helper for handling hybrid authentication.
 * This class bypasses the standard UI login flow by extracting the CSRF token
 * and submitting the login payload directly via an API request,
 * preserving session state and significantly speeding up test execution.
 */
import { APIRequestContext, Page, expect, APIResponse } from '@playwright/test';

/**
 * Provides methods to authenticate into the OrangeHRM application using API requests.
 */
export class AuthAPI {
    readonly request: APIRequestContext;
    readonly page: Page; // Thêm đối tượng page

    /**
     * Initializes the AuthAPI helper.
     * @param request - The independent API request context.
     * @param page - The Playwright Page instance used to share session cookies and extract DOM tokens.
     */
    constructor(request: APIRequestContext, page: Page) {
        this.request = request;
        this.page = page;
    }

    /**
     * Performs a backend login by simulating the form submission process.
     * @param username - The user's login ID.
     * @param password - The user's password.
     * @returns The API response from the validation endpoint.
     */
    async loginViaAPI(username?: string, password?: string, customToken?: string) {
        // 1. Navigate to the login page to initialize the session and trigger frontend scripts
        await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

        let csrfToken = customToken;

        // If no customToken is provided, extract the authentic token from the DOM (Positive scenario)
        if (customToken == undefined) {
            const tokenInput = this.page.locator('input[name="_token"]');
            await tokenInput.waitFor({ state: 'attached' });
            csrfToken = await tokenInput.inputValue() || '';
        }

        // 2. Submit the authentication payload via POST request
        // Capture start time to measure Performance SLA
        const startTime = Date.now();
        const response = await this.page.request.post('https://opensource-demo.orangehrmlive.com/web/index.php/auth/validate', {
            form: {
                username: username || '',
                password: password || '',
                _token: csrfToken || ''
            },
            // Prevent Playwright from automatically following the 302 redirect,
            // allowing the test script to assert the exact response status and Location header
            maxRedirects: 0
        });

        const responseTime = Date.now() - startTime;
        // Attach the calculated response time to the response object for downstream assertions
        (response as any).responseTimeMs = responseTime;

        return response;
    };

    /**
     * Performs a backend logout via API to clean up state after tests.
     * @returns {Promise<void>}
     */
    async logoutViaAPI() {
        await this.page.request.get('https://opensource-demo.orangehrmlive.com/web/index.php/auth/logout');
    };

    // ========================================================================
    // VERIFICATION KEYWORDS (POM)
    // ========================================================================

    /**
     * KEYWORD STEP VERIFY: Ensures the response time complies with the performance SLA.
     * @param {APIResponse} response - The executed API response object.
     * @param {number} [maxDurationMs=1500] - The maximum allowed duration in milliseconds.
     */
    async verifyResponseTimeSLA(response: APIResponse, maxDurationMs: number = 1500) {
        const duration = (response as any).responseTimeMs;
        if (duration) {
            expect(duration).toBeLessThan(maxDurationMs);
        }
    }

    /**
     * KEYWORD STEP VERIFY: Asserts successful authentication, proper redirection, and session cookie issuance.
     * @param {APIResponse} response - The executed API response object.
     */
    async verifyRedirectToDashboard(response: APIResponse) {
        // Assert the HTTP status code
        expect(response.status()).toBe(302);

        // Assert the redirect destination in the Location header
        expect(response.headers()['location']).toContain('/web/index.php/dashboard/index');

        // Assert that a new session identifier cookie is successfully issued
        const setCookieHeader = response.headers()['set-cookie'];
        expect(setCookieHeader).toBeDefined();
        expect(setCookieHeader).toContain('orangehrm'); // Ensure the OrangeHRM session cookie is present
    };

    /**
     * KEYWORD STEP VERIFY: Asserts failed authentication redirects the user back to the login page.
     * @param {APIResponse} response - The executed API response object.
     */
    async verifyRedirectToLogin(response: APIResponse) {
        expect(response.status()).toBe(302);
        expect(response.headers()['location']).toContain('/web/index.php/auth/login');
    };

    /**
     * KEYWORD STEP VERIFY: Validates on the UI layer that the background API session injection is active and functional.
     */
    async verifyUISessionIsActive() {
        // Directly navigate to the dashboard page, bypassing the UI login form flow
        await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index');

        // Wait for the system top bar to load. If the API session is valid, this element becomes visible immediately.
        const topBarHeader = this.page.locator('.oxd-topbar-header-title');
        await expect(topBarHeader).toBeVisible();
        await expect(topBarHeader).toContainText('Dashboard');
    }
}