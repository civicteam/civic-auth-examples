import { test, expect } from '@playwright/test';
import { waitForCivicIframeToLoad, waitForCivicIframeToClose } from '../../../helpers/iframe-helpers';

test.describe('Wagmi Login Tests', () => {
  test('should complete login flow and show balance', async ({ page, browserName }) => {
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
    
    // Wait for iframe to fully load with content (CI-safe)
    const frame = await waitForCivicIframeToLoad(page, { 
      iframeSelector: '[data-testid="civic-auth-iframe-with-resizer"]',
      timeout: 60000 
    });
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await expect(dummyButton).toBeEnabled({ timeout: 10000 });
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await waitForCivicIframeToClose(page, { timeout: 30000 });

    // Verify Ghost button is visible in dropdown
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 60000 });
    
    // Verify wallet address is displayed
    await expect(page.locator('text=/Wallet address: [A-Za-z0-9]{32,44}/')).toBeVisible({ timeout: 20000 });
    
    // Verify balance is displayed
    await expect(page.locator('text=Balance: 0 ETH')).toBeVisible({ timeout: 20000 });
  });
}); 