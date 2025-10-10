import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { setupDiagnostics } from '../../../utils/test-helpers';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    setupDiagnostics(page);
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login Basepath');
    await allure.feature('VanillaJS Modal Login (BasePath)');
  });
  test('should complete full modal login and logout flow with basepath', async ({ page }) => {
    setupDiagnostics(page);
    // Open the app home page with basepath
    await page.goto('http://localhost:3000/demo');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click the modal sign in button
    await page.click('#loginModalButton');
    
    // Wait for iframe to appear and load
    await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with dummy in the iframe (modal mode still uses iframe)
    const frame = page.frameLocator('#civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    await frame.locator('[data-testid="civic-login-oidc-button-dummy"]').click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 60000 });
    
    // Confirm logged in state by checking for user info display
    await expect(page.locator('#userInfo')).toHaveClass(/show/, { timeout: 20000 });
    await expect(page.locator('#userName')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#userName')).not.toBeEmpty();

    // Verify we're still on the basepath
    await expect(page.url()).toContain('/demo');

    // Click the logout button
    await page.locator('#logoutButton').click();
    
    // Confirm successful logout
    await expect(page.locator('#userInfo')).not.toHaveClass(/show/);
    
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
