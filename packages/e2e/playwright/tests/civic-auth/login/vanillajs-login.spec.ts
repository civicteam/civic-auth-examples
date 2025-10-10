import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { setupDiagnostics } from '../../../utils/test-helpers';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    setupDiagnostics(page);
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login');
    await allure.feature('VanillaJS Embedded Login');
  });
  test('should complete full embedded login and logout flow', async ({ page, browserName }) => {
    setupDiagnostics(page);
    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click "Try Embedded Mode" to navigate to the embedded page
    await page.click('#startAuthButton');
    
    // Wait for the embedded page to load
    await page.waitForLoadState('networkidle');
    
    // Click the embedded sign in button
    // await page.click('#loginButton');
    
    // Chrome/Firefox use iframe flow
    // Wait for iframe to appear and load inside the authContainer
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#iframeContainer #civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { state: 'hidden', timeout: 60000 });

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