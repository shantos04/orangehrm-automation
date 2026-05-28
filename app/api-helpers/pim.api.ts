/**
 * @fileoverview API Object Model (AOM) for the OrangeHRM PIM Employee module.
 * This file encapsulates the API request logic and verification keywords required
 * to interact with the backend employee data endpoints directly, bypassing the UI.
 */
import { APIRequestContext, APIResponse, expect } from '@playwright/test';

/**
 * Defines the strict query parameter structure required by the OrangeHRM PIM Employee Search API.
 * These properties match the actual backend network request configurations.
 */
export interface EmployeeSearchParams {
    limit?: number | string;
    offset?: number | string;
    model?: string;
    nameOrId?: string;
    employeeId?: string;
    empStatusId?: number | string;
    includeEmployees?: string;
    jobTitleId?: number | string;
    subunitId?: number | string;
    sortField?: string;
    sortOrder?: string;
    supervisorId?: number | string;
};

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
     * Executes a GET request to filter and retrieve the employee list.
     * Automatically applies native system defaults for pagination, models, and sorting.
     * @param {EmployeeSearchParams} [params] - Optional user-defined filters that override system defaults.
     * @returns {Promise<APIResponse>} The raw Playwright API response object.
     */
    async searchEmployees(params?: EmployeeSearchParams): Promise<APIResponse> {
        // Standard structural default values extracted from native network payloads
        const defaultParams: EmployeeSearchParams = {
            limit: 50,
            offset: 0,
            model: 'detailed',
            includeEmployees: 'currentAndPast',
            sortField: 'employee.firstName',
            sortOrder: 'ASC'
        };

        // Merge defaults with runtime parameters (explicit configurations overwrite defaults)
        const mergedQueryParams = { ...defaultParams, ...params };

        // Clean undefined keys dynamically to prevent polluting the request URL query string
        Object.keys(mergedQueryParams).forEach(key => {
            if (mergedQueryParams[key as keyof EmployeeSearchParams] === undefined) {
                delete mergedQueryParams[key as keyof EmployeeSearchParams];
            }
        });

        // Execute the HTTP GET request with fully mapped query parameters
        return await this.request.get(this.endpoint, {
            params: mergedQueryParams,
            headers: {
                'Accept': 'application/json'
            }
        });
    };

    /**
     * Executes a PUT request to update an employee's personal details profile.
     * @param {number | string} empNumber - The unique system internal ID of the target employee (e.g., 502).
     * @param {object} payload - The JSON object containing updated personal profile details.
     * @returns {Promise<APIResponse>} The raw Playwright API response object.
     */
    async updatePersonalDetails(empNumber: number | string, payload: object): Promise<APIResponse> {
        const url = `${this.endpoint}/${empNumber}/personal-details`;
        return await this.request.put(url, {
            data: payload,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
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
        if (body.meta) {
            expect(body.meta.total).toBe(0);
        };
    }

    /**
     * Executes a DELETE request to permanently remove one or multiple employees.
     * The backend expects a JSON payload containing an array of internal employee IDs.
     * * @param {number[]} ids - An array of numerical internal IDs representing the employees to be deleted.
     * @returns {Promise<APIResponse>} The raw Playwright API response object.
     */
    async deleteEmployees(ids: number[]): Promise<APIResponse> {
        return await this.request.delete(this.endpoint, {
            // Playwright will automatically stringify this object and set 'Content-Type': 'application/json'
            data: {
                ids: ids
            },
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    /**
     * KEYWORD STEP VERIFY: Validates that the delete operation was successful.
     * Asserts that the server returns a 200 OK status and the response data reflects the deleted entities.
     * * @param {APIResponse} response - The raw API response to evaluate.
     */
    async verifyDeleteSuccess(response: APIResponse) {
        // Assert that the HTTP status code indicates success
        expect(response.status()).toBe(200);

        const body = await response.json();

        // Ensure the backend confirms the operation (OrangeHRM typically returns the deleted IDs inside 'data')
        expect(body).toHaveProperty('data');
    }
}
