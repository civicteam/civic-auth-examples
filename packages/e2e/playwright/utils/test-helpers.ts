import { Page } from '@playwright/test';

/**
 * Setup diagnostic monitoring for page console messages and network failures.
 * This helps debug issues in CI environments where tests might fail silently.
 * 
 * @param page - The Playwright page object
 * @param testName - Optional test name for better logging context
 */
export function setupDiagnostics(page: Page, testName?: string) {
  const consoleMessages: string[] = [];
  const failedRequests: string[] = [];
  const prefix = testName ? `[${testName}]` : '';

  // Monitor console messages from the page
  page.on('console', msg => {
    const message = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(message);
    console.log(`${prefix}[PAGE CONSOLE] ${message}`);
  });

  // Monitor failed network requests
  page.on('requestfailed', request => {
    const failure = `${request.method()} ${request.url()} - ${request.failure()?.errorText}`;
    failedRequests.push(failure);
    console.log(`${prefix}[REQUEST FAILED] ${failure}`);
  });

  // Monitor HTTP error responses from civic.com domains
  page.on('response', async response => {
    if (!response.ok() && response.url().includes('civic.com')) {
      const message = `${response.status()} ${response.url()}`;
      console.log(`${prefix}[BAD RESPONSE] ${message}`);
      
      // Try to get response body for more context
      try {
        const body = await response.text();
        if (body) {
          console.log(`${prefix}[RESPONSE BODY] ${body.substring(0, 500)}`);
        }
      } catch (e) {
        // Response body might not be available
      }
    }
  });

  // Monitor page errors (unhandled exceptions)
  page.on('pageerror', error => {
    console.log(`${prefix}[PAGE ERROR] ${error.message}`);
    console.log(`${prefix}[ERROR STACK] ${error.stack}`);
  });

  return {
    consoleMessages,
    failedRequests,
    getSummary: () => ({
      totalConsoleMessages: consoleMessages.length,
      totalFailedRequests: failedRequests.length,
      hasErrors: failedRequests.length > 0 || 
                 consoleMessages.some(msg => msg.includes('[error]'))
    })
  };
}

