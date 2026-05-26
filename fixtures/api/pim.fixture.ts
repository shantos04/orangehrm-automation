/**
 * @fileoverview Custom Playwright API Fixture for the PIM Module.
 * Automatically handles backend authentication via hybrid flow before injecting the PimAPI instance.
 */

import { test as base } from '@playwright/test';
import { PimAPI } from '../../app/api-helpers/pim.api';
import { AuthAPI } from '../../app/api-helpers/auth.api'; // Nhớ check lại tên file gốc
import authData from '../../data/auth-data.json';

type PimFixtures = {
    pimAPI: PimAPI;
};

// ĐƯA THÊM 'page' VÀO TRONG NGOẶC NHỌN ĐỂ PLAYWRIGHT CẤP PHÁT TRÌNH DUYỆT
export const test = base.extend<PimFixtures>({
    pimAPI: async ({ request, page }, use) => {

        // ====================================================================
        // STEP 1: PRE-REQUISITE AUTHENTICATION (Hybrid Setup)
        // ====================================================================
        // Khởi tạo AuthAPI với ĐẦY ĐỦ 2 tham số mà class của bạn yêu cầu
        const authAPI = new AuthAPI(request, page);

        // Chạy hàm login. Lúc này trình duyệt ẩn sẽ mở ra, lấy CSRF token và bắn POST.
        // Sau lệnh này, bộ nhớ của 'page' đã chứa Cookie đăng nhập thành công.
        await authAPI.loginViaAPI(authData.validAccount.username, authData.validAccount.password);

        // ====================================================================
        // STEP 2: MODULE INITIALIZATION
        // ====================================================================
        // 🚀 CỰC KỲ QUAN TRỌNG: Phải truyền 'page.request' (chứa cookie) thay vì 'request' rỗng
        const pimAPI = new PimAPI(page.request);

        // Expose the authenticated API helper to the test specifications
        await use(pimAPI);
    },
});

export { expect } from '@playwright/test';