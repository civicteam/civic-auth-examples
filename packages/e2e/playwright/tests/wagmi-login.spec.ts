import { test, expect } from '@playwright/test';

test.describe('Wagmi Login Tests', () => {
  test('should complete login flow and show balance', async ({ page, browserName }) => {
    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click the sign in button
    await page.click('button:has-text("Sign in")');
    
    if (browserName === 'webkit') {
      // WebKit uses redirect flow instead of iframe
      // Wait for the dummy button on the auth page directly (without waiting for URL)
      const dummyButton = page.locator('[data-testid="civic-login-oidc-button-dummy"]');
      await dummyButton.waitFor({ timeout: 30000 });
      await dummyButton.click();
    } else {
      // Chrome/Firefox use iframe flow
      // Click log in with dummy in the iframe
      const frame = page.frameLocator('#civic-auth-iframe');
      await frame.locator('[data-testid="civic-login-oidc-button-dummy"]').click({ timeout: 20000 });

      // Wait for the iframe to be gone (indicating login is complete)
      await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    }

    // Verify Ghost button is visible in dropdown
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 60000 });
    
    // Verify wallet address is displayed
    await expect(page.locator('text=/Wallet address: [A-Za-z0-9]{32,44}/')).toBeVisible({ timeout: 20000 });
    
    // Verify balance is displayed
    await expect(page.locator('text=Balance: 0 ETH')).toBeVisible({ timeout: 20000 });
  });
}); 