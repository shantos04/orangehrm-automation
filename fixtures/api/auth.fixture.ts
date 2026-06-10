import { test as base } from '@playwright/test';
import { AuthAPI } from '../../app/api-helpers/auth.api';

import * as allure from "allure-js-commons";
import path from 'path';

type AuthFixtures = {
    authAPI: AuthAPI;
};

export const test = base.extend<AuthFixtures>({
    authAPI: async ({ request, page }, use) => {
        const authAPI = new AuthAPI(request, page);
        await use(authAPI);
    },
});

test.beforeEach(async ({ }, testInfo) => {
    const relativePath = path.relative(testInfo.project.testDir, testInfo.file);
    const autoPackageName = relativePath
        .replace(/\.spec\.ts$/, '')
        .replace(/[\\/]/g, '.');

    await allure.label("package", autoPackageName);
});

export { expect } from '@playwright/test';