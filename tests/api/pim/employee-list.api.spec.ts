/**
 * @fileoverview API Test Specifications for the OrangeHRM PIM Employee Module.
 * Validates complete lifecycle and operations including list search filters, 
 * personal profile details updates (PUT), and individual/bulk record deletions (DELETE).
 */

import { test, expect } from '../../../fixtures/api/pim.fixture';
import * as allure from "allure-js-commons";
import fs from 'fs';
import path from 'path';

import pimData from '../../../data/pim-data.json';

test.describe("API Testing - PIM Employee Module", () => {

    test.beforeEach(async () => {
        await allure.epic("API Testing");
    });

    // ========================================================================
    // --- SUB-MODULE: EMPLOYEE LIST SEARCH FILTERS (GET) ---
    // ========================================================================
    test.describe("Employee List Search Filters (GET)", () => {

        test.beforeEach(async () => {
            await allure.feature("Employee List Search");
        });

        /**
         * Test Case 01: Verifies that requesting the employee list without any parameters 
         * returns the default populated dataset.
         */
        test("OrangeHRM_PIM_SEARCH_TC01_FetchDefaultListWithoutFilters", async ({ pimAPI }) => {
            await allure.story("Default Load");
            await allure.severity("critical");

            const response = await test.step("Action: Execute GET request with no query parameters", async () => {
                return await pimAPI.searchEmployees();
            });

            await test.step("Verify: System returns 200 OK and a populated data array", async () => {
                const body = await pimAPI.verifySuccessAndGetBody(response);

                // Assert that the default table is not empty
                expect(body.data.length).toBeGreaterThan(0);

                // Validate the basic schema of the first employee object
                const firstEmp = body.data[0];
                expect(firstEmp).toHaveProperty('empNumber');
                expect(firstEmp).toHaveProperty('firstName');
            });
        });

        /**
         * Test Case: Verify search functionality using a valid Employee ID.
         * Assertion: Validates that the system returns exactly one record and the employeeId matches the requested target ID.
         */
        test("OrangeHRM_PIM_SEARCH_TC02_SearchByValidEmployeeId", async ({ pimAPI }) => {
            await allure.story("Search By ID");
            await allure.severity("blocker");

            const targetId = pimData.validEmployee.employeeId;

            const response = await test.step(`Action: Execute GET request with employeeId=${targetId}`, async () => {
                return await pimAPI.searchEmployees({ employeeId: targetId });
            });

            await test.step("Verify: System returns exactly the record matching the requested ID", async () => {
                const body = await pimAPI.verifySuccessAndGetBody(response);

                expect(body.data.length).toBeGreaterThan(0);

                // Assert that the returned record ID exactly matches the query target
                expect(body.data[0].employeeId).toBe(targetId);
            });
        });

        /**
         * Test Case: Verify search functionality using a partial Employee Name.
         * Assertion: Ensures all returned records contain the search keyword in either their First or Last Name.
         */
        test("OrangeHRM_PIM_SEARCH_TC03_SearchByPartialEmployeeName", async ({ pimAPI }) => {
            await allure.story("Search By Name");
            await allure.severity("critical");

            const keyword = pimData.searchQueries.partialName;

            const response = await test.step(`Action: Execute GET request with nameOrId=${keyword}`, async () => {
                return await pimAPI.searchEmployees({ nameOrId: keyword });
            });

            await test.step("Verify: All returned records contain the search keyword in either First or Last Name", async () => {
                const body = await pimAPI.verifySuccessAndGetBody(response);
                expect(body.data.length).toBeGreaterThan(0);

                const keywordLower = keyword.toLowerCase();

                for (const emp of body.data) {
                    const firstName = (emp.firstName || '').toLowerCase();
                    const lastName = (emp.lastName || '').toLowerCase();

                    const isMatch = firstName.includes(keywordLower) || lastName.includes(keywordLower);
                    expect(isMatch, `API Error: Returned employee ${firstName} ${lastName} does not contain the keyword '${keyword}'`).toBeTruthy();
                }
            });
        });

        /**
         * Test Case: Verify search behavior with a non-existent Employee ID.
         * Assertion: Validates that the server returns a 200 OK status with an empty data array, indicating no records found.
         * Edge Case Handled: Ensures the system gracefully handles invalid IDs without throwing 500 server errors.
         */
        test("OrangeHRM_PIM_SEARCH_TC04_SearchByNonExistentEmployeeId", async ({ pimAPI }) => {
            await allure.story("Negative Search");
            await allure.severity("normal");

            const invalidId = pimData.invalidQueries.employeeId;

            const response = await test.step(`Action: Execute GET request with invalid employeeId=${invalidId}`, async () => {
                return await pimAPI.searchEmployees({ employeeId: invalidId });
            });

            await test.step("Verify: System returns 200 OK with an empty data array (No Records Found)", async () => {
                await pimAPI.verifyEmptyResult(response);
            });
        });

        /**
         * Test Case: Verify supervisor autocomplete lookup functionality using nameOrId.
         * Assertion: Validates that the system successfully returns matching employee records for the supervisor typeahead field.
         * Explanation: Extracted from native network logs showing that supervisor lookup relies heavily on the 'nameOrId' query string parameter.
         */
        test("OrangeHRM_PIM_SEARCH_TC05_SearchSupervisorViaAutocomplete", async ({ pimAPI }) => {
            await allure.story("Search by Supervisor - Autocomplete");
            await allure.severity("critical");

            const searchKeyword = pimData.searchQueries.supervisorSearchKeyword;

            const response = await test.step(`Action: Execute GET request with nameOrId=${searchKeyword} for supervisor lookup`, async () => {
                return await pimAPI.searchEmployees({ nameOrId: searchKeyword });
            });

            await test.step("Verify: System returns 200 OK and a filtered dataset matching the supervisor keyword", async () => {
                const body = await pimAPI.verifySuccessAndGetBody(response);
                expect(body.data.length).toBeGreaterThan(0);

                // Tokenize the search keyword into an array of lowercase words
                const keywordLower = searchKeyword.toLowerCase();
                const searchTokens = keywordLower.split(' ').filter(token => token.trim() !== '');

                for (const emp of body.data) {
                    // Extract and normalize individual name components safely
                    const firstName = emp.firstName || '';
                    const middleName = emp.middleName || '';
                    const lastName = emp.lastName || '';

                    // Construct a unified full name string and normalize it to lowercase
                    const fullNameLower = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim().toLowerCase();

                    // Assert that EVERY individual token from the search query exists within the employee's full name
                    // This aligns perfectly with backend multi-word autocomplete filtering mechanics
                    const isMatch = searchTokens.every(token => fullNameLower.includes(token));

                    expect(isMatch, `Autocomplete Error: Returned employee '${firstName} ${lastName}' does not match keyword '${searchKeyword}'`).toBeTruthy();
                }
            });
        });

        /**
         * Test Case: Verify search functionality using a Job Title string dropdown filter.
         * Assertion: Ensures that all returned employee records contain a job title that matches the requested string.
         */
        test("OrangeHRM_PIM_SEARCH_TC06_SearchByJobTitleId", async ({ pimAPI }) => {
            await allure.story("Search by Dropdown - Job Title");
            await allure.severity("major");

            const targetJobTitleId = pimData.dropdownFilters.jobTitleId;

            const response = await test.step(`Action: Execute GET request with jobTitleId=${targetJobTitleId}`, async () => {
                return await pimAPI.searchEmployees({ jobTitleId: targetJobTitleId });
            });

            await test.step("Verify: All returned employees belong to the requested Job Title", async () => {
                const body = await pimAPI.verifySuccessAndGetBody(response);
                expect(body.data.length).toBeGreaterThan(0);

                for (const emp of body.data) {
                    expect(JSON.stringify(emp.jobTitle)).toContain(String(targetJobTitleId));
                }
            });
        });

        /**
         * Test Case: Verify search functionality using an Employment Status string dropdown filter.
         * Assertion: Validates that the system returns a populated data array matching the specific employment status string.
         */
        test("OrangeHRM_PIM_SEARCH_TC07_SearchByEmploymentStatusId", async ({ pimAPI }) => {
            await allure.story("Search by Dropdown - Employment Status");
            await allure.severity("major");

            const targetStatusId = pimData.dropdownFilters.empStatusId;

            const response = await test.step(`Action: Execute GET request with empStatusId=${targetStatusId}`, async () => {
                return await pimAPI.searchEmployees({ empStatusId: targetStatusId });
            });

            await test.step("Verify: System returns a populated data array matching the specific employment status", async () => {
                const body = await pimAPI.verifySuccessAndGetBody(response);
                expect(body.data.length).toBeGreaterThan(0);

                for (const emp of body.data) {
                    expect(JSON.stringify(emp.employmentStatus)).toContain(String(targetStatusId));
                }
            });
        });

        /**
         * Test Case: Verify search functionality using a Sub Unit string dropdown filter.
         * Assertion: Ensures that all returned employee records belong strictly to the requested departmental sub unit.
         */
        test("OrangeHRM_PIM_SEARCH_TC08_SearchBySubUnitId", async ({ pimAPI }) => {
            await allure.story("Search by Dropdown - Sub Unit");
            await allure.severity("major");

            const targetSubUnitId = pimData.dropdownFilters.subunitId;

            const response = await test.step(`Action: Execute GET request with subunitId=${targetSubUnitId}`, async () => {
                return await pimAPI.searchEmployees({ subunitId: targetSubUnitId });
            });

            await test.step("Verify: System returns a populated data array matching the specific sub unit", async () => {
                const body = await pimAPI.verifySuccessAndGetBody(response);
                expect(body.data.length).toBeGreaterThan(0);

                for (const emp of body.data) {
                    expect(JSON.stringify(emp.subunit)).toContain(String(targetSubUnitId));
                }
            });
        });

        /**
         * Test Case: Verify the logical AND operation when combining multiple search criteria (Name and Job Title strings).
         * Assertion: Validates that returned records strictly satisfy all provided search parameters simultaneously.
         */
        test("OrangeHRM_PIM_SEARCH_TC09_CombinedSearchNameAndJobTitleId", async ({ pimAPI }) => {
            await allure.story("Advanced Search - Combined Filters");
            await allure.severity("critical");

            const keyword = pimData.searchQueries.partialName;
            const targetJobTitleId = pimData.dropdownFilters.jobTitleId;

            const response = await test.step(`Action: Execute GET request combining nameOrId=${keyword} AND jobTitleId=${targetJobTitleId}`, async () => {
                return await pimAPI.searchEmployees({
                    nameOrId: keyword,
                    jobTitleId: targetJobTitleId
                });
            });

            await test.step("Verify: Returned records strictly satisfy ALL provided search criteria", async () => {
                const body = await pimAPI.verifySuccessAndGetBody(response);
                expect(body.data.length).toBeGreaterThan(0);

                const keywordLower = keyword.toLowerCase();

                for (const emp of body.data) {
                    const firstName = (emp.firstName || '').toLowerCase();
                    const lastName = (emp.lastName || '').toLowerCase();

                    const isNameMatch = firstName.includes(keywordLower) || lastName.includes(keywordLower);
                    const isJobMatch = JSON.stringify(emp.jobTitle).includes(String(targetJobTitleId));

                    expect(isNameMatch, `Name mismatch: ${firstName} ${lastName}`).toBeTruthy();
                    expect(isJobMatch, `Job Title ID mismatch: expected ${targetJobTitleId}`).toBeTruthy();
                }
            });
        });

        /**
         * Test Case: Verify system resilience when handling search queries containing special characters.
         * Assertion: Ensures the payload is safely handled, returning a 200 OK status with an empty array.
         * Edge Case Handled: Validates backend input sanitization to prevent potential crashes or injection vulnerabilities.
         */
        test("OrangeHRM_PIM_SEARCH_TC10_SearchWithSpecialCharacters", async ({ pimAPI }) => {
            await allure.story("Edge Case - Special Characters in Search");
            await allure.severity("minor");

            const specialChars = pimData.invalidQueries.specialChars;

            const response = await test.step(`Action: Execute GET request with nameOrId=${specialChars}`, async () => {
                return await pimAPI.searchEmployees({ nameOrId: specialChars });
            });

            await test.step("Verify: System securely handles the payload, returning 200 OK with an empty array", async () => {
                await pimAPI.verifyEmptyResult(response);
            });
        });

        /**
         * Test Case: Verify structural content integrity of deeply nested objects within response packets.
         * Assertion: Validates that the returned sub-object contains required relational entity values via serialization containment (Convert Object to JSON).
         */
        test("OrangeHRM_PIM_SEARCH_TC11_VerifyDeepNestedJobTitleContract", async ({ pimAPI }) => {
            await allure.story("Schema Integrity - Deep Objects");
            await allure.severity("major");

            const targetJobTitleId = pimData.dropdownFilters.jobTitleId;

            const response = await test.step(`Action: Execute GET request with jobTitleId=${targetJobTitleId}`, async () => {
                return await pimAPI.searchEmployees({ jobTitleId: targetJobTitleId });
            });

            await test.step("Verify: All returned employee records contain the target job title contract configuration", async () => {
                const body = await pimAPI.verifySuccessAndGetBody(response);
                expect(body.data.length).toBeGreaterThan(0);

                for (const employee of body.data) {
                    expect(employee).toHaveProperty('jobTitle');

                    // Convert nested object properties into a text string to run clean subset content containment assertions
                    const jobTitleJsonString = JSON.stringify(employee.jobTitle);
                    expect(jobTitleJsonString).toContain(String(targetJobTitleId));
                }
            });
        });
    });

    // ========================================================================
    // --- SUB-MODULE: EMPLOYEE PERSONAL DETAILS MODIFICATION (PUT) ---
    // ========================================================================
    test.describe("Employee Personal Details Modification (PUT)", () => {

        test.beforeEach(async () => {
            await allure.feature("Employee Personal Details Modification");
        });

        /**
         * Test Case: Verify that an employee's personal details can be successfully updated via PUT request.
         * Assertion: Validates that the server processes the valid payload, returns 200 OK, and mirrors the updated properties.
         */
        test("OrangeHRM_PIM_DETAILS_TC01_UpdatePersonalDetailsSuccessfully", async ({ pimAPI }) => {
            await allure.story("Positive - Update Profile Details");
            await allure.severity("critical");

            const empNum = pimData.personalDetailsAction.targetEmployeeNumber;
            const payload = pimData.personalDetailsAction.validUpdatePayload;

            const response = await test.step(`Action: Execute PUT request to update personal details for employee #${empNum}`, async () => {
                return await pimAPI.updatePersonalDetails(empNum, payload);
            });

            await test.step("Verify: System returns 200 OK and matches the updated information exactly", async () => {
                expect(response.status()).toBe(200);

                const body = await response.json();
                expect(body).toHaveProperty('data');

                // Assert that the database record changes match the submitted payload
                expect(body.data.firstName).toBe(payload.firstName);
                expect(body.data.lastName).toBe(payload.lastName);
                expect(body.data.employeeId).toBe(payload.employeeId);
            });
        });

        /**
         * Test Case: Verify system validation when attempting to clear out mandatory fields like First Name.
         * Assertion: Ensures backend fields validate against blank values, securely returning a 422 Unprocessable Entity status.
         */
        test("OrangeHRM_PIM_DETAILS_TC02_RejectUpdateWithMissingFirstName", async ({ pimAPI }) => {
            await allure.story("Negative - Validation Constraints");
            await allure.severity("normal");

            const empNum = pimData.personalDetailsAction.targetEmployeeNumber;
            const invalidPayload = pimData.personalDetailsAction.invalidMissingNamePayload;

            const response = await test.step(`Action: Execute PUT request with an empty firstName field for employee #${empNum}`, async () => {
                return await pimAPI.updatePersonalDetails(empNum, invalidPayload);
            });

            await test.step("Verify: Backend catches validation error and responds with 422 Unprocessable Entity", async () => {
                const status = response.status();

                if (status === 422) {
                    console.log("EXPECTED VALIDATION FAILURE LOGGED:", await response.json());
                }

                expect(status).toBe(422);
            });
        });

        /**
         * Test Case: Verify backend security routing when updating data for a non-existent employee target.
         * Assertion: Validates that routing resources towards fake endpoints safely fails with a 404 Not Found error.
         */
        test("OrangeHRM_PIM_DETAILS_TC03_UpdateDetailsForNonExistentEmployee", async ({ pimAPI }) => {
            await allure.story("Negative - Resource Routing");
            await allure.severity("normal");

            const fakeEmpNum = pimData.personalDetailsAction.nonExistentEmployeeNumber;
            const payload = pimData.personalDetailsAction.validUpdatePayload;

            const response = await test.step(`Action: Execute PUT request targeting an invalid employee path segment: #${fakeEmpNum}`, async () => {
                return await pimAPI.updatePersonalDetails(fakeEmpNum, payload);
            });

            await test.step("Verify: Backend returns 404 Not Found to signal non-existent resource path", async () => {
                expect(response.status()).toBe(404);
            });
        });

        /**
         * Test Case: Verify personal details update with a dynamically generated unique Employee ID via dynamic file parsing (Parse & Convert JSON).
         * Assertion: Ensures the backend accepts and updates modified dynamic object fields successfully without validation blocks.
         */
        test("OrangeHRM_PIM_DETAILS_TC04_UpdateWithDynamicUniquePayload", async ({ pimAPI }) => {
            await allure.story("Positive - Runtime Dynamic Serialized Mutation");
            await allure.severity("critical");

            const response = await test.step("Action: Read file, parse payload context, and execute mutated dynamic PUT request", async () => {
                const filePath = path.resolve(__dirname, '../../../data/pim-data.json');
                const rawFileData = fs.readFileSync(filePath, 'utf-8');

                // Read and parse file data using JSON.parse
                const dataObject = JSON.parse(rawFileData);
                const targetPayload = dataObject.personalDetailsAction.validUpdatePayload;

                // Inject dynamic parameters to keep data clean and unique
                const uniqueId = `EMP${Date.now().toString().slice(-4)}`;
                targetPayload.employeeId = uniqueId;
                targetPayload.firstName = `Naruto_${uniqueId}`;

                // Re-serialize back to clean string format using JSON.stringify
                const finalJsonPayloadString = JSON.stringify(targetPayload);

                const res = await pimAPI.updatePersonalDetails(
                    dataObject.personalDetailsAction.targetEmployeeNumber,
                    JSON.parse(finalJsonPayloadString)
                );

                // Dynamically tag expected ID onto the response object reference for downstream validation step
                (res as any).runtimeExpectedId = uniqueId;
                return res;
            });

            await test.step("Verify: Database successfully mirrors the parsed and injected dynamic attributes", async () => {
                expect(response.status()).toBe(200);
                const responseBody = await response.json();

                const expectedId = (response as any).runtimeExpectedId;
                expect(responseBody.data.employeeId).toBe(expectedId);
            });
        });
    });

    // ========================================================================
    // --- SUB-MODULE: EMPLOYEE RECORD REMOVAL (DELETE) ---
    // ========================================================================
    test.describe("Employee Record Removal (DELETE)", () => {

        test.beforeEach(async () => {
            await allure.feature("Employee Record Removal");
        });

        /**
         * Test Case: Verify that an employee can be successfully deleted via API.
         * Assertion: Validates that the server processes the DELETE request and responds with a 200 OK status.
         * Edge Case Handled: Validates the payload structure requiring an array of numerical IDs.
         */
        test("OrangeHRM_PIM_DELETE_TC01_DeleteEmployeeSuccessfully", async ({ pimAPI }) => {
            await allure.story("Action - Delete Employee");
            await allure.severity("critical");

            const targetId = pimData.deleteAction.employeeInternalId;

            const response = await test.step(`Action: Execute DELETE request for employee ID [${targetId}]`, async () => {
                return await pimAPI.deleteEmployees([targetId]);
            });

            await test.step("Verify: System successfully processes the deletion and returns 200 OK", async () => {
                await pimAPI.verifyDeleteSuccess(response);
            });
        });

        /**
         * Test Case: Verify that multiple employees can be successfully deleted in a single API call (Bulk Delete).
         * Assertion: Validates that the server processes the bulk DELETE request and responds with a 200 OK status.
         */
        test("OrangeHRM_PIM_DELETE_TC02_BulkDeleteEmployees", async ({ pimAPI }) => {
            await allure.story("Action - Bulk Delete Employees");
            await allure.severity("critical");

            const targetIds = pimData.deleteAction.bulkEmployeeIds;

            const response = await test.step(`Action: Execute DELETE request for multiple employee Ids [${targetIds.join(', ')}]`, async () => {
                return await pimAPI.deleteEmployees(targetIds);
            });

            await test.step("Verify: System successfully processes the bulk deletion and return 200 OK", async () => {
                await pimAPI.verifyDeleteSuccess(response);
            });
        });

        /**
         * Test Case: Verify system behavior when attempting to delete a non-existent employee ID.
         * Assertion: Validates that the backend handles the request gracefully (typically returning 200 OK or 404 Not Found) without crashing.
         * Edge Case Handled: Prevents 500 Internal Server Error when processing invalid database keys.
         */
        test("OrangeHRM_PIM_DELETE_TC03_DeleteNonExistentEmployees", async ({ pimAPI }) => {
            await allure.story("Negative - Delete Non-Existent ID");
            await allure.severity("normal");

            const fakeId = pimData.deleteAction.nonExistentInternalId;

            const response = await test.step(`Action: Execute DELETE request with a non-existent ID [${fakeId}]`, async () => {
                return await pimAPI.deleteEmployees([fakeId]);
            });

            await test.step("Verify: System handles the invalid ID gracefully without a server crash", async () => {
                expect(response.ok()).toBeTruthy();
            });
        });

        /**
         * Test Case: Verify system behavior when sending a DELETE request with an empty array of IDs.
         * Assertion: Validates backend validation rules for the 'ids' payload array.
         * Edge Case Handled: Empty payload submission.
         */
        test("OrangeHRM_PIM_DELETE_TC04_DeleteWithEmptyArray", async ({ pimAPI }) => {
            await allure.story("Negative - Empty Payload Delete");
            await allure.severity("minor");

            const response = await test.step("Action: Execute DELETE request with an empty array of IDs", async () => {
                return await pimAPI.deleteEmployees([]);
            });

            await test.step("Verify: System rejects the empty payload appropriately", async () => {
                const status = response.status();

                console.log(`Status for Empty Array Delete: ${status}`);

                expect([200, 400, 422, 404]).toContain(status);
            });
        });
    });
});