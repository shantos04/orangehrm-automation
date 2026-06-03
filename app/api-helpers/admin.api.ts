/**
 * @fileoverview API Object Model (AOM) for the OrangeHRM Admin User Management module.
 * Encapsulates backend rest endpoints for managing system access accounts.
 */

import { APIRequestContext, APIResponse, expect } from '@playwright/test';

export interface AdminUserSearchParams {
    limit?: number | string;
    offset?: number | string;
    username?: string;
    userRoleId?: number | string; // Maps to 'User Role' dropdown choice
    nameOrId?: string;
    status?: number | string;   // Maps to 'Status' dropdown choice
    sortField?: string;
    sortOrder?: string;
}

export class AdminAPI {
    readonly request: APIRequestContext;
    readonly endpoint: string = '/web/index.php/api/v2/admin/users';

    constructor(request: APIRequestContext) {
        this.request = request;
    }

    /**
     * Executes a GET request to search and filter system administrative users.
     */
    async searchUsers(params?: AdminUserSearchParams): Promise<APIResponse> {
        const defaultParams: AdminUserSearchParams = {
            limit: 50,
            offset: 0,
            sortField: 'u.username',
            sortOrder: 'ASC'
        };

        const mergedQueryParams = { ...defaultParams, ...params };

        Object.keys(mergedQueryParams).forEach(key => {
            if (mergedQueryParams[key as keyof AdminUserSearchParams] === undefined) {
                delete mergedQueryParams[key as keyof AdminUserSearchParams];
            }
        });

        return await this.request.get(this.endpoint, {
            params: mergedQueryParams,
            headers: { 'Accept': 'application/json' }
        });
    }
}