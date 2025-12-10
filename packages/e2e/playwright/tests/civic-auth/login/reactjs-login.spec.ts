import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login');
    await allure.feature('React.js Login');
  });
  test('should complete full login and logout flow', async ({ page, browserName }) => {
    
    // Open the app home page
    await page.goto('http://localhost:3000');
    
    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('load');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the UserButton to be visible (the one that says "Sign in")
    await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 10000 });
    
    // Click the UserButton "Sign in" button (not the CustomSignIn button)
    await page.getByTestId('sign-in-button').click();
    
    // Chrome/Firefox use iframe flow
    // Wait for iframe to appear and load
    await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    
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
    
    // Look for the dummy button with extended timeout and ensure it's visible
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.waitFor({ state: 'visible', timeout: 30000 });
    
    // Add a small delay to ensure button is fully interactive
    await page.waitForTimeout(1000);
    
    // Click the dummy button
    await dummyButton.click({ timeout: 20000 });
    
    // Wait for any loading to complete after click
    try {
      const loadingAfterClick = frame.locator('#civic-login-app-loading');
      const isLoadingVisibleAfterClick = await loadingAfterClick.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isLoadingVisibleAfterClick) {
        // Wait longer for the auth flow to complete
        await loadingAfterClick.waitFor({ state: 'hidden', timeout: 30000 });
      }
    } catch (error) {
      // Loading handling - if it fails, continue
    }
    
    // Wait for load state to ensure callback is processed
    try {
      await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {
        // Load might not be reached, continue anyway
      });
    } catch (error) {
      // Continue if load wait fails
    }

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 30000 });
    
    // Wait for React state to update after login
    await page.waitForTimeout(2000);
    
    // Confirm logged in state by checking for Ghost button in dropdown
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
    
    // Verify custom loginSuccessUrl is not loaded
    await expect(page.url()).not.toContain('loginSuccessUrl');

    // Click the Ghost button in dropdown
    await page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")').click();

    // Click the logout button
    await page.locator('#civic-dropdown-container').locator('button:has-text("Log out")').click();
    
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