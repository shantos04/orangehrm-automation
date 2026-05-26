import { test as base } from '@playwright/test';
import { AuthAPI } from '../../app/api-helpers/auth.api';

type AuthFixtures = {
    authAPI: AuthAPI;
};

export const test = base.extend<AuthFixtures>({
    authAPI: async ({ request, page }, use) => {
        const authAPI = new AuthAPI(request, page);
        await use(authAPI);
    },
});

export { expect } from '@playwright/test';