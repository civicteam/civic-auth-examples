import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login');
    await allure.feature('Solana Next.js 15 No Wallet Adapter Login');
  });
  test('should complete full login and logout flow', async ({ page, browserName }) => {
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes

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
        await loadingAfterClick.waitFor({ state: 'hidden', timeout: 60000 });
      }
    } catch (error) {
      // Loading handling - if it fails, continue
    }

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 60000 });
  
    // Confirm logged in state by checking for Ghost button in dropdown
    const ghostButtonLocator = page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")');
    await expect(ghostButtonLocator).toBeVisible({ timeout: 20000 });
    
    // Verify wallet address is displayed (Web3 functionality)
    await expect(page.locator('text=/Wallet address: [A-Za-z0-9]{32,44}/')).toBeVisible({ timeout: 20000 });
    
    // Verify custom loginSuccessUrl is not loaded
    await expect(page.url()).not.toContain('loginSuccessUrl');

    // Click the Ghost button in dropdown with retry logic for Firefox
    const ghostButton = page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")');
    await ghostButton.waitFor({ state: 'visible', timeout: 10000 });
    await ghostButton.click();

    // Wait a moment for dropdown to fully expand
    await page.waitForTimeout(500);

    // Click the logout button with more robust handling
    const logoutButton = page.locator('#civic-dropdown-container').locator('button:has-text("Log out")');
    
    // Try multiple approaches to handle Firefox dropdown timing issues
    try {
      await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
      await logoutButton.click();
    } catch (error) {
      // Fallback: click Ghost again to re-open dropdown and try logout
      await ghostButton.click();
      await page.waitForTimeout(500);
      await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
      await logoutButton.click();
    }
    
    // Confirm successful logout with longer timeout for Firefox
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible({ timeout: 15000 });
    
    // Wait for logout process to complete before checking cookies
    await page.waitForTimeout(1000);
    
    // Verify essential cookies are deleted after logout
    const cookiesAfterLogout = await page.context().cookies();
    const remainingAuthCookies = cookiesAfterLogout.filter(cookie => 
      cookie.name.includes('civic-auth') || 
      cookie.name.includes('access_token') || 
      cookie.name.includes('refresh_token') ||
      cookie.name.includes('id_token') ||
      cookie.name.includes('session')
    );
    
    // Assert that essential auth cookies have been deleted (allow for some Firefox timing quirks)
    // If there's still 1 cookie, wait a bit longer and check again
    if (remainingAuthCookies.length > 0) {
      await page.waitForTimeout(2000);
      const finalCookies = await page.context().cookies();
      const finalAuthCookies = finalCookies.filter(cookie => 
        cookie.name.includes('civic-auth') || 
        cookie.name.includes('access_token') || 
        cookie.name.includes('refresh_token') ||
        cookie.name.includes('id_token') ||
        cookie.name.includes('session')
      );
      expect(finalAuthCookies.length).toBe(0);
    }
    
    // Additional verification: try to access a protected route to ensure session is cleared
    // Handle redirect to /unauthenticated as expected behavior
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    } catch (error) {
      // If navigation is interrupted by redirect, that's actually expected behavior
      if (error.message.includes('interrupted by another navigation')) {
        await page.waitForLoadState('networkidle');
      } else {
        throw error;
      }
    }
    
    // Should be back to logged-out state (Sign In button visible, Ghost button not visible)
    await expect(page.getByTestId('sign-in-button')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
  });
}); 