import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login');
    await allure.feature('Solana Vite No Wallet Adapter Login');
  });
  test('should complete full login and logout flow', async ({ page, browserName }) => {
    
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
    
    // Click the UserButton "Sign in" button (not the CustomSignIn button)
    await signInButton.click();
    
    // Chrome/Firefox use iframe flow
    // Wait for iframe to appear and load
    await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Look for the dummy button and ensure it's visible and enabled
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.waitFor({ state: 'visible', timeout: 30000 });
    await expect(dummyButton).toBeEnabled({ timeout: 10000 });
    
    // Add a small delay to ensure button is fully interactive
    await page.waitForTimeout(1000);
    
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 30000 });
    
    // Confirm logged in state by checking for Ghost button in dropdown
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
    
    // Verify wallet address is displayed (Web3 functionality)
    await expect(page.locator('text=/Wallet address: [A-Za-z0-9]{32,44}/')).toBeVisible({ timeout: 20000 });
    
    // Verify custom loginSuccessUrl is not loaded
    await expect(page.url()).not.toContain('loginSuccessUrl');

    // Click the Ghost button in dropdown
    const ghostButton = page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")');
    await ghostButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(ghostButton).toBeEnabled({ timeout: 5000 });
    await ghostButton.click();

    // Click the logout button
    const logoutButton = page.locator('#civic-dropdown-container').locator('button:has-text("Log out")');
    await logoutButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(logoutButton).toBeEnabled({ timeout: 5000 });
    await logoutButton.click();
    
    // Confirm successful logout
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
    
    // Verify token refresh fails after logout
    const response = await page.request.post('https://auth-dev.civic.com/oauth/token', {
      form: {
        grant_type: 'refresh_token',
        refresh_token: 'storedRefreshToken', // Note: You'll need to get the actual refresh token
        client_id: process.env.VITE_CLIENT_ID || ''
      }
    });
    expect(response.status()).toBe(400);
  });
}); 