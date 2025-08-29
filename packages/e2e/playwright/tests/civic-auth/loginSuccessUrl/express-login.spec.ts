import { test, expect } from '@playwright/test';

test.describe('Express Login Tests (LoginSuccessUrl)', () => {
  test('should complete full login and logout flow with custom loginSuccessUrl', async ({ page, browserName }) => {
    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click the sign in button using test ID
    await page.getByTestId('sign-in-button').click();
    
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
  
    // Confirm logged in state by checking for Ghost button in dropdown
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
    
    // Verify custom loginSuccessUrl is loaded - should redirect to /customSuccessRoute
    await expect(page.url()).toContain('/customSuccessRoute');

    // Capture essential cookies after login
    const cookiesAfterLogin = await page.context().cookies();
    const authCookies = cookiesAfterLogin.filter(cookie => 
      cookie.name.includes('civic-auth') || 
      cookie.name.includes('access_token') || 
      cookie.name.includes('refresh_token') ||
      cookie.name.includes('id_token') ||
      cookie.name.includes('session')
    );
    
    // Verify we have essential auth cookies
    expect(authCookies.length).toBeGreaterThan(0);

    // Click the Ghost button in dropdown
    await page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")').click();

    // Click the logout button
    await page.locator('#civic-dropdown-container').locator('button:has-text("Logout")').click();
    
    // Confirm successful logout
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
    
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
    expect(remainingAuthCookies.length).toBe(0);
    
    // Additional verification: try to access the home route to ensure session is cleared
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Should be back to logged-out state (Sign In button visible, Ghost button not visible)
    await expect(page.getByTestId('sign-in-button')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
  });
});
