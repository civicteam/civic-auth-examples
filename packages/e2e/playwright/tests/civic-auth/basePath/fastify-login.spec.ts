import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { setupDiagnostics } from '../../../utils/test-helpers';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    setupDiagnostics(page);
    await allure.epic('Civic Auth Applications');
    await allure.suite('BasePath');
    await allure.feature('Fastify Login (BasePath)');
  });
  
  test('should complete login flow and redirect to hello page', async ({ page, browserName }) => {
    setupDiagnostics(page);
    test.setTimeout(120000); // Increase timeout to 2 minutes
    
    // Go to the app home page - Fastify redirects to Civic auth
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    // Wait for redirect to auth-dev.civic.com (full page redirect, not iframe)
    await page.waitForURL(/.*auth-dev\.civic\.com.*/, { timeout: 30000 });
 
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the login UI to fully load (no iframe - direct page)
    try {
      const loadingElement = page.locator('#civic-login-app-loading');
      const isLoadingVisible = await loadingElement.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isLoadingVisible) {
        await loadingElement.waitFor({ state: 'hidden', timeout: 45000 });
      }
    } catch (error) {
      // Loading element might not exist, that's ok
    }
    
    // Wait for login elements to appear
    await page.locator('[data-testid*="civic-login"]').first().waitFor({ timeout: 30000 });
    
    // Look for the dummy button (directly on page, not in iframe)
    const dummyButton = page.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.waitFor({ state: 'visible', timeout: 30000 });
    
    // Add a small delay to ensure button is fully interactive
    await page.waitForTimeout(1000);
    
    // Click the dummy button
    await dummyButton.click({ timeout: 20000 });
    
    // Wait for any loading to complete after click
    try {
      const loadingAfterClick = page.locator('#civic-login-app-loading');
      const isLoadingVisibleAfterClick = await loadingAfterClick.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isLoadingVisibleAfterClick) {
        await loadingAfterClick.waitFor({ state: 'hidden', timeout: 30000 });
      }
    } catch (error) {
      // Loading handling - if it fails, continue
    }

    // Wait for redirect to /admin/hello
    await expect(page).toHaveURL(/.*\/admin\/hello/, { timeout: 30000 });
    
    // Check the page content
    await expect(page.locator('h1')).toContainText('Hello', { timeout: 10000 });
  });
}); 
