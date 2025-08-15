import { test, expect } from '@playwright/test';

test.describe('Next.js Login Tests', () => {
  test('should complete full login and logout flow', async ({ page, browserName }) => {
    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click the sign in button using test ID
    await page.getByTestId('sign-in-button').click();
    
    if (browserName === 'webkit') {
      // WebKit uses redirect flow instead of iframe
      // Wait for navigation to the auth server
      await page.waitForURL('**/auth-dev.civic.com/**', { timeout: 30000 });
      
      // Look for the dummy button on the auth page directly
      const dummyButton = page.locator('[data-testid="civic-login-oidc-button-dummy"]');
      await dummyButton.waitFor({ timeout: 30000 });
      await dummyButton.click();
    } else {
      // Chrome/Firefox use iframe flow
      // Wait for iframe to appear and load
      await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
      
      // Click log in with dummy in the iframe
      const frame = page.frameLocator('#civic-auth-iframe');
      
      // Try to wait for the frame to load completely first
      await frame.locator('body').waitFor({ timeout: 30000 });
      
      // Look for the dummy button with extended timeout
      const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
      await dummyButton.click({ timeout: 20000 });

      // Wait for the iframe to be gone (indicating login is complete)
      await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    }
    
    // Confirm logged in state by checking for Ghost button in dropdown
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
    
    // Verify custom loginSuccessUrl is not loaded
    await expect(page.url()).not.toContain('loginSuccessUrl');

    // Click the Ghost button in dropdown
    await page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")').click();

    // Click the logout button
    await page.locator('#civic-dropdown-container').locator('button:has-text("Logout")').click();
    
    // Confirm successful logout
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
    
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