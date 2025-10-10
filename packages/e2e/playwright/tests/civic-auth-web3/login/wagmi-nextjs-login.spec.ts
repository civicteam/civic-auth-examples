import { test, expect } from '@playwright/test';

test.describe('Wagmi Login Tests', () => {
  test('should complete login flow and show balance', async ({ page, browserName }) => {    
    setupDiagnostics(page);
    // Open the app home page
    await page.goto('http://localhost:3000');
    
    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the sign in button to be visible and enabled/clickable
    const signInButton = page.getByTestId('sign-in-button');
    await signInButton.waitFor({ state: 'visible', timeout: 30000 });
    await expect(signInButton).toBeEnabled({ timeout: 10000 });
    
    // Add a small delay to ensure the button is fully interactive
    await page.waitForTimeout(1000);
    
    // Click the sign in button using test ID
    await signInButton.click();
    
    // Chrome/Firefox use iframe flow
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('[data-testid="civic-auth-iframe-with-resizer"]');
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.waitFor({ state: 'visible', timeout: 30000 });
    await expect(dummyButton).toBeEnabled({ timeout: 10000 });
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('[data-testid="civic-auth-iframe-with-resizer"]', { state: 'hidden', timeout: 40000 });

    // Verify Ghost button is visible in dropdown
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 30000 });
    
    // Verify wallet address is displayed
    await expect(page.locator('text=/Wallet address: [A-Za-z0-9]{32,44}/')).toBeVisible({ timeout: 20000 });
    
    // Verify balance is displayed
    await expect(page.locator('text=/Balance: \\d+(\\.\\d+)? ETH/')).toBeVisible({ timeout: 20000 });
  });
}); 