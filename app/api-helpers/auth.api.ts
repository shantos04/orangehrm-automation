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
     * * @param username - The user's login ID.
     * @param password - The user's password.
     * @returns The API response from the validation endpoint.
     */
    async loginViaAPI(username?: string, password?: string) {
        // 1. Navigate to the login page to initialize the session and trigger frontend scripts
        await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

        // 2. Extract the dynamically generated CSRF token directly from the hidden DOM element
        // Wait for the hidden input to be attached to the DOM before reading its value to prevent flakiness
        const tokenInput = this.page.locator('input[name="_token"]');
        await tokenInput.waitFor({ state: 'attached' });
        const csrfToken = await tokenInput.inputValue();

        if (!csrfToken) {
            console.warn("Không tìm thấy CSRF Token!");
        }

        // 3. Submit the authentication payload via POST request
        // Utilizing `this.page.request` ensures that the Session Cookies generated in Step 1 are automatically included
        return await this.page.request.post('https://opensource-demo.orangehrmlive.com/web/index.php/auth/validate', {
            form: {
                username: username || '',
                password: password || '',
                _token: csrfToken
            },
            // Prevent Playwright from automatically following the 302 redirect,
            // allowing the test script to assert the exact response status and Location header
            maxRedirects: 0
        });
    };

    // ========================================================================
    // VERIFICATION KEYWORDS (POM)
    // ========================================================================

    /**
     * Verifies that the API response successfully redirects to the Dashboard.
     */
    async verifyRedirectToDashboard(response: APIResponse) {
        expect(response.status()).toBe(302);
        expect(response.headers()['location']).toContain('/web/index.php/auth/login');
    }

    /**
     * Verifies that the API response rejects the login and redirects back to the Login page.
     */
    async verifyRedirectToLogin(response: APIResponse) {
        expect(response.status()).toBe(302);
        expect(response.headers()['location']).toContain('/web/index.php/auth/login');
    }
}