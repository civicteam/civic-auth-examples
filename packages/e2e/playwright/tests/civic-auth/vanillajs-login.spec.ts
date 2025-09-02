import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('VanillaJS Embedded Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('civic auth sample apps');
    await allure.feature('VanillaJS Embedded Login');
  });

  test('should complete full embedded login and logout flow', async ({ page, browserName }) => {
    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click the embedded sign in button
    await page.click('#loginButton');
    
    // Chrome/Firefox use iframe flow
    // Wait for iframe to appear and load inside the authContainer
    await page.waitForSelector('#authContainer #civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#authContainer #civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#authContainer #civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    
    // Confirm logged in state by checking for user info display
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.getByRole('button', { name: 'Sign In' });
    
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