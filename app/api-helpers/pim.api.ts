/**
 * @fileoverview API Object Model (AOM) for the OrangeHRM PIM Employee module.
 * This file encapsulates the API request logic and verification keywords required
 * to interact with the backend employee data endpoints directly, bypassing the UI.
 */
import { APIRequestContext, APIResponse, expect } from '@playwright/test';

/**
 * Provides methods to construct requests and verify responses for the Employee List API.
 */
export class PimAPI {
    readonly request: APIRequestContext;

    // The exact backend REST API endpoint for retrieving employee records
    readonly endpoint: string = '/web/index.php/api/v2/pim/employees';

    /**
     * Initializes the API helper with the Playwright request context.
     * @param {APIRequestContext} request - The isolated API request context.
     */
    constructor(request: APIRequestContext) {
        this.request = request;
    };

    /**
     * Executes a GET request to retrieve a list of employees based on optional filter criteria.
     * The parameter names strictly mirror the backend Query String Parameters.
     * * @param {Object} [searchParams] - Optional filters to apply to the search query.
     * @param {string} [searchParams.employeeName] - Partial or full name of the employee.
     * @param {string} [searchParams.empNumber] - The exact employee ID/number.
     * @param {string} [searchParams.supervisorName] - The name of the employee's supervisor.
     * @param {number} [searchParams.jobTitleId] - The internal backend ID representing the job title.
     * @param {number} [searchParams.empStatusId] - The internal backend ID representing employment status.
     * @param {number} [searchParams.subunitId] - The internal backend ID representing the organizational subunit.
     * @param {number} [searchParams.include] - Flag to include current (1) or past (2) employees.
     * @returns {Promise<APIResponse>} The raw Playwright API response object.
     */
    async searchEmployees(employees?: {
        employeeName?: string;
        empNumber?: string;
        supervisorName?: string;
        jobTitle?: string;
        empStatus?: string;
        subUnit?: string;
        include?: string;
    }): Promise<APIResponse> {
        return await this.request.get(this.endpoint, {
            params: employees,
            headers: {
                'Accept': 'application/json'
            }
        });
    };

    // ========================================================
    // --- Verification Keywords (Step Verify) ---
    // ========================================================

    /**
     * Verifies that the API request was successful and returned a valid, populated data array.
     * * @param {APIResponse} response - The raw API response to evaluate.
     * @returns {Promise<any>} The parsed JSON body for further downstream assertions.
     */
    async verifySuccessAndGetBody(response: APIResponse) {
        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(body).toHaveProperty('data');
        expect(Array.isArray(body.data)).toBeTruthy();

        return body;
    }

    /**
     * Verifies that the API correctly handled a search yielding no results.
     * The backend should still return a 200 OK status, but with an empty data payload.
     * * @param {APIResponse} response - The raw API response to evaluate.
     */
    async verifyEmptyResult(response: APIResponse) {
        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(body.data).toEqual([]);
        expect(body.meta.total).toBe(0);
    }
}
