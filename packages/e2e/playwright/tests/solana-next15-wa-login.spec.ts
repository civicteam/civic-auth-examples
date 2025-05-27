import { test, expect } from '@playwright/test';

test.describe('Solana Next15 Wallet Adapter Login Tests', () => {
  test('should complete login flow and show balance', async ({ page }) => {
    // Open the app home page
    await page.goto('http://localhost:3000');
    
    // Click the select wallet button
    await page.click('.wallet-adapter-button-trigger');
    
    // Click the civic wallet button
    await page.click('button:has-text("Civic")');
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#civic-auth-iframe');
    await frame.locator('[data-testid="civic-login-oidc-button-dummy"]').click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });

    // Verify wallet adapter button shows connected state
    await expect(page.locator('.wallet-adapter-button.wallet-adapter-button-trigger')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('.wallet-adapter-button-start-icon')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.wallet-adapter-button-trigger')).toContainText(/^[A-Za-z0-9]{4}\.\.([A-Za-z0-9]{4})$/, { timeout: 20000 });
    
    // Verify wallet address is displayed
    await expect(page.locator('text=/Wallet address: [A-Za-z0-9]{32,44}/')).toBeVisible({ timeout: 20000 });
    
    // Verify balance is displayed
    await expect(page.locator('text=Balance: 0 SOL')).toBeVisible({ timeout: 20000 });
  });
}); 