import {test, expect} from '@playwright/test';
import {LoginPage} from '../../pages/login.page';
import usersData from '../../data/users.json';

test.describe("PIM Module - Add Employee", () => {

    let loginPage: LoginPage;

    test.beforeEach(async ({page}) => {
        test.setTimeout(60000);
        loginPage = new LoginPage(page);

        await page.goto('/web/index.php/auth/login');
        await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);
        
        await page.goto('/web/index.php/pim/addEmployee');
    });
})