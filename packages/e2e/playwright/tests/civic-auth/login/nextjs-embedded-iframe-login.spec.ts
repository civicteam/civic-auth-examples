import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Civic Auth Applications - Embedded Iframe', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login');
    await allure.feature('Next.js Embedded Iframe Login');
  });

  test('should complete full login and logout flow with embedded iframe', async ({ page, browserName }) => {
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes

    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // For embedded iframe, the container should be immediately visible (no button click needed)
    const embeddedContainer = page.getByTestId('embedded-iframe-container');
    await embeddedContainer.waitFor({ state: 'visible', timeout: 30000 });
    
    // Wait for the heading to confirm we're on the login page
    await expect(page.locator('h1:has-text("Embedded Iframe Login")')).toBeVisible({ timeout: 10000 });
    
    // Wait for iframe to be present in DOM (embedded mode)
    await page.waitForSelector('#civic-auth-iframe', { state: 'attached', timeout: 30000 });
    
    // Get the iframe
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
    
    // Click the dummy button to log in
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

    // Wait for navigation to complete and page to update
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Confirm logged in state by checking for the logged-in content
    const loggedInContent = page.getByTestId('logged-in-content');
    await expect(loggedInContent).toBeVisible({ timeout: 20000 });
    
    // Verify the Welcome heading is visible
    await expect(page.locator('h1:has-text("Welcome!")')).toBeVisible({ timeout: 10000 });
    
    // Verify user email is displayed
    const userEmail = page.getByTestId('user-email');
    await expect(userEmail).toBeVisible({ timeout: 10000 });
    await expect(userEmail).toContainText('Logged in as:');
    
    // Verify the embedded iframe container is no longer visible
    await expect(embeddedContainer).not.toBeVisible();

    // Now test logout flow
    // Click the UserButton (which opens a dropdown)
    const userButton = page.locator('#civic-dropdown-container').locator('button').first();
    await userButton.waitFor({ state: 'visible', timeout: 10000 });
    await userButton.click();

    // Wait a moment for dropdown to fully expand
    await page.waitForTimeout(500);

    // Click the logout button
    const logoutButton = page.locator('#civic-dropdown-container').locator('button:has-text("Log out")');
    
    // Try multiple approaches to handle dropdown timing issues
    try {
      await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
      await logoutButton.click();
    } catch (error) {
      // Fallback: click user button again to re-open dropdown and try logout
      await userButton.click();
      await page.waitForTimeout(500);
      await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
      await logoutButton.click();
    }
    
    // Confirm successful logout - logged in content should disappear
    await expect(loggedInContent).not.toBeVisible({ timeout: 15000 });
    
    // The embedded iframe container should be visible again (back to login state)
    await expect(embeddedContainer).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1:has-text("Embedded Iframe Login")')).toBeVisible({ timeout: 10000 });
    
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
    
    // Assert that essential auth cookies have been deleted
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
    
    // Additional verification: reload page to ensure session is cleared
    await page.reload({ waitUntil: 'networkidle', timeout: 10000 });
    
    // Should be back to logged-out state (embedded iframe visible, logged-in content not visible)
    await expect(embeddedContainer).toBeVisible({ timeout: 10000 });
    await expect(loggedInContent).not.toBeVisible();
  });
});

