/**
 * @fileoverview Page Object Model for the OrangeHRM Login Page.
 * This class encapsulates the locators and UI elements specific to the authentication screen.
 */

import {Page, Locator} from '@playwright/test';

export class LoginPage {
    /** The Playwright Page instance representing the current browser tab. */
    readonly page: Page;

    /** Locator for the username text input field. */
    readonly txtUsername: Locator;

    /** Locator for the password text input field. */
    readonly txtPassword: Locator;

    /** Locator for the login submission button. */
    readonly btnLogin: Locator;

    /** Locator for the invalid credentials error alert message. */
    readonly msgError: Locator;

    /** Locator for the entire row block containing the Username field. */
    readonly usernameBlock: Locator;

    /** Locator for the required validation message under the Username field. */
    readonly msgUsernameRequired: Locator;

    /** Locator for the entire row block containing the Password field. */
    readonly passwordBlock: Locator;

    /** Locator for the required validation message under the Password field. */
    readonly msgPasswordRequired: Locator;

    /**
     * Initializes the locators for the Login Page elements.
     * @param {Page} page - The Playwright Page instance used to interact with the DOM.
     */
    constructor(page: Page) {
        this.page = page;

        this.txtUsername = page.getByPlaceholder('Username');
        this.txtPassword = page.getByPlaceholder('Password');
        this.btnLogin = page.getByRole('button', {name: 'Login', exact: true});

        this.msgError = page.locator('.oxd-alert.oxd-alert--error');

        this.usernameBlock = page.locator('.oxd-form-row').filter({has: page.getByPlaceholder('Username')});
        this.passwordBlock = page.locator('.oxd-form-row').filter({has: page.getByPlaceholder('Password')})
        
        this.msgUsernameRequired = this.usernameBlock.locator('.oxd-input-field-error-message');
        this.msgPasswordRequired = this.passwordBlock.locator('.oxd-input-field-error-message');
    }

    /**
     * Performs the login sequence by entering credentials.
     * Optionally clicks the submit button based on the provided flag.
     * @param {string} username - The username string retrieved from test data.
     * @param {string} password - The password string used for authentication.
     * @param {boolean} [clickSubmit=true] - Determines whether to click the login button. Defaults to true.
     * @returns {Promise<void>} A promise that resolves once the actions are performed.
     */
    async login(username: string, password: string, clickSubmit: boolean = true) {
        await this.txtUsername.fill(username);
        await this.txtPassword.fill(password);

        if (clickSubmit) {
            await this.btnLogin.click();
        };
    }
}