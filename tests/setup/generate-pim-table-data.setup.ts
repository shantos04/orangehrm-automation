import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../../app/pages/login.page';
import { PimPage } from '../../app/pages/pim.page';
import usersData from '../../data/users.json';

setup("Generate Expected PIM Table Data from UI", async ({ page }) => {
    setup.setTimeout(300000);

    const loginPage = new LoginPage(page);
    const pimPage = new PimPage(page);

    await page.goto('/web/index.php/auth/login');
    await loginPage.login(usersData.validAdmin.username, usersData.validAdmin.password);
    await page.waitForURL('**/dashboard/index');
    await page.goto('/web/index.php/pim/viewEmployeeList');

    await expect(pimPage.tableContainer).toBeVisible();
    await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

    const allScrapedData = [];
    let hasNextPage = true;

    while (hasNextPage) {
        const rows = await pimPage.tableRows.all();

        for (const row of rows) {
            const rowTexts = await row.locator('.oxd-table-cell').allInnerTexts();

            allScrapedData.push({
                id: rowTexts[1]?.trim() || "",
                firstName: rowTexts[2]?.trim() || "",
                lastName: rowTexts[3]?.trim() || "",
                jobTitle: rowTexts[4]?.trim() || "",
                employmentStatus: rowTexts[5]?.trim() || "",
                subunit: rowTexts[6]?.trim() || "",
                supervisor: rowTexts[7]?.trim() || ""
            });
        }
        const isVisible = await pimPage.btnNextPage.isVisible();
        // const isDisabled = await pimPage.btnNextPage.isDisabled() || (await pimPage.btnNextPage.getAttribute('class') || '').includes('disabled');

        if (isVisible) {
            await pimPage.btnNextPage.click();
            await pimPage.tableLoadingSpinner.waitFor({ state: 'hidden' });

            await page.waitForTimeout(500);
        } else {
            hasNextPage = false;
        }
    }

    const dataDirPath = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDirPath)) {
        fs.mkdirSync(dataDirPath, { recursive: true });
    }

    const filePath = path.join(dataDirPath, 'expected-table-data.json');
    fs.writeFileSync(filePath, JSON.stringify(allScrapedData, null, 2), 'utf-8');
})