import { test, expect } from '@playwright/test';

test.describe('Solana Next15 Wallet Adapter Login Tests', () => {
  test('should complete login flow and show balance', async ({ page, browserName }) => {
    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for and click the select wallet button
    const selectWalletButton = page.locator('.wallet-adapter-button-trigger');
    await selectWalletButton.waitFor({ state: 'visible', timeout: 30000 });
    await expect(selectWalletButton).toBeEnabled({ timeout: 10000 });
    await selectWalletButton.click();
    
    // Wait for and click the civic wallet button
    const civicWalletButton = page.locator('button:has-text("Civic")');
    await civicWalletButton.waitFor({ state: 'visible', timeout: 30000 });
    await expect(civicWalletButton).toBeEnabled({ timeout: 10000 });
    await civicWalletButton.click();
    
        // Wait for iframe to be present in DOM (don't care if it's visible or hidden)
        await page.waitForSelector('#civic-auth-iframe', { state: 'attached', timeout: 30000 });
    
        // Click log in with dummy in the iframe
        const frame = page.frameLocator('#civic-auth-iframe');
        
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
        
        // Look for the dummy button with extended timeout and ensure it's visible and enabled
        const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
        await dummyButton.waitFor({ state: 'visible', timeout: 30000 });
        await expect(dummyButton).toBeEnabled({ timeout: 10000 });
        
        // Add a small delay to ensure button is fully interactive
        await page.waitForTimeout(1000);
        
        // Click the dummy button
        await dummyButton.click({ timeout: 20000 });

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