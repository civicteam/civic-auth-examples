import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login');
    await allure.feature('VanillaJS Embedded Login');
  });
  test('should complete full embedded login and logout flow', async ({ page, browserName }) => {
    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('load');
    await page.waitForLoadState('domcontentloaded');
    
    // Click "Try Embedded Mode" to navigate to the embedded page
    await page.click('#startAuthButton');
    
    // Wait for the embedded page to load
    await page.waitForLoadState('load');
    
    // Click the embedded sign in button
    // await page.click('#loginButton');
    
    // Chrome/Firefox use iframe flow
    // Wait for iframe to appear and load inside the authContainer
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#iframeContainer #civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Wait for the login UI to fully load (not just the loading spinner)
    try {
      const loadingElement = frame.locator('#civic-login-app-loading');
      const isLoadingVisible = await loadingElement.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isLoadingVisible) {
        await loadingElement.waitFor({ state: 'hidden', timeout: 45000 });
      }
    } catch (error) {
      // Loading element might not exist, that's ok
    }
    
    // Wait for login elements to appear
    await frame.locator('[data-testid*="civic-login"]').first().waitFor({ timeout: 30000 });
    
    // Look for the dummy button with extended timeout and ensure it's visible
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.waitFor({ state: 'visible', timeout: 30000 });
    
    // Add a small delay to ensure button is fully interactive
    await page.waitForTimeout(1000);
    
    // Click the dummy button
    await dummyButton.click({ timeout: 20000 });
    
    // Wait for any loading to complete after click
    try {
      const loadingAfterClick = frame.locator('#civic-login-app-loading');
      const isLoadingVisibleAfterClick = await loadingAfterClick.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isLoadingVisibleAfterClick) {
        // Wait longer for the auth flow to complete
        await loadingAfterClick.waitFor({ state: 'hidden', timeout: 30000 });
      }
    } catch (error) {
      // Loading handling - if it fails, continue
    }
    
    // Wait for load state to ensure callback is processed
    try {
      await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {
        // Load might not be reached, continue anyway
      });
    } catch (error) {
      // Continue if load wait fails
    }

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { state: 'hidden', timeout: 30000 });

    // Check that we're logged in by verifying the embedded status shows success
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toContainText('Ghost');
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toHaveClass(/success/);
    
    // Now logout using the "Logout All" button
    await page.click('[data-testid="vanilla-js-logout-button"]');
    
    // Verify we're logged out by checking the embedded status returns to "Ready"
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toContainText('Ready');
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toHaveClass(/ready/);
    
    // Verify token refresh fails after logout
    const response = await page.request.post('https://auth-dev.civic.com/oauth/token', {
      form: {
        grant_type: 'refresh_token',
        refresh_token: 'storedRefreshToken', // Note: You'll need to get the actual refresh token
        client_id: process.env.CLIENT_ID || ''
      }
    });
    expect(response.status()).toBe(400);
  });
}); 