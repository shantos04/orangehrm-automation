/**
 * @fileoverview Test suite for the OrangeHRM Login Module.
 * This file contains automated test cases to verify the UI state, structure,
 * and business logic (authentication) of the login page using the Page Object Model.
 */

import { test, expect } from '@playwright/test';
import {LoginPage} from '../../pages/login.page';

import usersData from '../../data/users.json';
import expectedTexts from '../../data/expected-texts.json';

/**
 * Test Suite: Authentication - Login Module
 * Focuses on verifying the Login flow and Data-Driven Testing.
 */
test.describe("Authentication - Login Module", () => {

    let loginPage: LoginPage;

    /**
     * Setup: Initializes the page object and navigates to the login route.
     */
    test.beforeEach(async ({page}) => {
        loginPage = new LoginPage(page);
        await page.goto('/web/index.php/auth/login');
    });

    /**
     * Test Case: Verify basic UI elements on the login page.
     * Assertion Category: UI state (toBeVisible).
     */
    test("OrangeHRM_Login_TC01_VerifyUILoginPage", async({page}) => {
        const expectedTitle = expectedTexts.loginPage.pageTitle;

        // Verify Page Metadata
        await expect(page).toHaveTitle(expectedTitle);

        // Verify UI Component Visibility (UI State)
        await expect(loginPage.txtUsername).toBeVisible();
        await expect(loginPage.txtPassword).toBeVisible();
        await expect(loginPage.btnLogin).toBeVisible();
    });

    /**
     * Test Case: Verify successful login with valid administrative credentials.
     * Assertion: Checks if the user is redirected and the 'Dashboard' header is visible.
     */
    test("OrangeHRM_Login_TC02_VerifySuccessfulLogin", async({page}) => {
        const testUsername = usersData.validAdmin.username;
        const testPassword = usersData.validAdmin.password;

        // Perform login action
        await loginPage.login(testUsername, testPassword);
        await expect(page.getByRole('heading', {name: 'Dashboard'})).toBeVisible();
    });

    /**
     * Test Case: Verify error handling when using an invalid password.
     * Assertion: Checks for the visibility and content of the error message.
     */
    test("OrangeHRM_Login_TC03_VerifyErrorInvalidPassword", async({page}) => {
        const testUsername = usersData.invalidPassword.username;
        const testPassword = usersData.invalidPassword.password;
        const errorMessage = expectedTexts.loginPage.invalidCredentialsError;

        await loginPage.login(testUsername, testPassword);

        await expect(loginPage.msgError).toBeVisible();
        await expect(loginPage.msgError).toHaveText(errorMessage);
    })
})