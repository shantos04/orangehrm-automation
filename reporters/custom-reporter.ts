/**
 * @fileoverview Custom Custom Reporter for Playwright Test Execution.
 */

import {Reporter, FullConfig, Suite, TestCase, TestResult, FullResult} from '@playwright/test/reporter';

class EnterpriseCustomReport implements Reporter {

    /**
     * Called once before running the tests.
     * @param config The resolved configuration.
     * @param suite The root suite containing all tests.
     */
    onBegin(config: FullConfig, suite: Suite): void {
        console.log('\n================================================================');
        console.log(`[INFO] TEST EXECUTION STARTED`);
        console.log(`[INFO] Total Tests Discovered: ${suite.allTests().length}`);
        console.log(`[INFO] Workers Allocated: ${config.workers}`);
        console.log('================================================================\n');
    }

    /**
     * Called when a test begins.
     * @param test The test case that is about to start.
     */
    onTestBegin(test: TestCase): void {
        // Using standard formatting for clean terminal output
        console.log(`[RUNNING] ${test.title}`);
    }

    /**
     * Called after a test has finished,
     * @param test The test case that just finished.
     * @param result The result of the test execution.
     */
    onTestEnd(test: TestCase, result: TestResult): void {
        const durationStr = `(${result.duration}ms)`;

        switch (result.status) {
            case 'passed':
                console.log(`[PASS]    ${test.title} ${durationStr}`);
                break;

            case 'failed':
            case 'timedOut':
                console.log(`[FAIL]    ${test.title} ${durationStr}`);
                
                // Extract and log the specific error message safely
                if (result.error && result.error.message) {
                    const firstErrorLine = result.error.message.split('\n')[0];
                    console.error(`          -> Reason: ${firstErrorLine}`);
                }
                break;

            case 'skipped':
                console.log(`[SKIP]    ${test.title}`);
                break;
            
            default:
                console.log(`[UNKNOWN] ${test.title} - Status: ${result.status}`);
        }
    }

    /**
     * Called after all tests have been executed.
     * @param result The overall execution result.
     */
    onEnd(result: FullResult): void {
        console.log('\n================================================================');
        console.log(`[INFO] TEST EXECUTION COMPLETED`);
        console.log(`[INFO] Final Status: ${result.status.toUpperCase()}`);
        console.log(`[INFO] Total Execution Time: ${result.duration}ms`);
        console.log('================================================================\n');
    }

    /**
     * Called on some global error, for example unhandled exception in the worker.
     * @param error The error object.
     */
    onError(error: any): void {
        console.error('\n[FATAL ERROR] An unexpected global error occurred:');
        console.error(error.message || error);
    }
}

export default EnterpriseCustomReport;