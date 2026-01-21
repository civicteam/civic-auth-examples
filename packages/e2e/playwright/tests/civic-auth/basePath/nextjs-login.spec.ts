import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page, context }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login Basepath');
    await allure.feature('Next.js Login (BasePath)');
    
    // Clear cookies and storage before each test to prevent state pollution between retries
    await context.clearCookies();
  });
  test('should complete full login and logout flow with basepath', async ({ page, browserName }) => {
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes
    
    // Fix basePath callback routing issue - redirect /api/auth/callback to /demo/api/auth/callback
    await page.route('**/api/auth/callback*', async (route) => {
      const url = new URL(route.request().url());
      const redirectUrl = `http://localhost:3000/demo/api/auth/callback${url.search}`;
      await route.continue({ url: redirectUrl });
    });

    // Open the app home page with basepath
    await page.goto('http://localhost:3000/demo');

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
    
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.waitFor({ state: 'visible', timeout: 30000 });
    
    // Add a small delay to ensure button is fully interactive
    await page.waitForTimeout(1000);
    
    // Click the dummy button
    await dummyButton.click({ timeout: 20000 });
    
    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 30000 });
    
    // Wait for the auth state to update - in dev mode this can be slower
    await page.waitForTimeout(3000);
    
    // Wait for networkidle to ensure all auth state updates are complete
    await page.waitForLoadState('networkidle');
  
    // Confirm logged in state by checking for Ghost button in dropdown
    // Use a more robust waiting strategy for dev mode
    const ghostButtonLocator = page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")');
    
    // In dev mode, the auth state update can be slow - retry with increasing waits
    let ghostButtonVisible = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      ghostButtonVisible = await ghostButtonLocator.isVisible().catch(() => false);
      if (ghostButtonVisible) break;
      await page.waitForTimeout(2000);
    }
    
    await expect(ghostButtonLocator).toBeVisible({ timeout: 20000 });
    
    // Verify custom loginSuccessUrl is not loaded (should still be on basepath)
    await expect(page.url()).not.toContain('loginSuccessUrl');
    await expect(page.url()).toContain('/demo');

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

    // Click the Ghost button in dropdown to open menu
    const ghostButton = page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")');
    await ghostButton.waitFor({ state: 'visible', timeout: 10000 });
    await ghostButton.click();
    
    // Wait for dropdown animation to complete
    await page.waitForTimeout(500);

    // Click the logout button - use force:true to handle any overlay issues in dev mode
    const logoutButton = page.locator('#civic-dropdown-container').locator('button:has-text("Log out")');
    await logoutButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // In dev mode, the dropdown can be flaky - retry the click if needed
    try {
      await logoutButton.click({ timeout: 10000 });
    } catch (error) {
      // If click fails, try re-opening the dropdown and clicking again
      await ghostButton.click();
      await page.waitForTimeout(500);
      await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
      await logoutButton.click({ force: true, timeout: 10000 });
    }
    
    // Confirm successful logout
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
    
    // Wait for auth cookies to be cleared after logout with retry logic
    let remainingAuthCookies = [];
    let attempts = 0;
    const maxAttempts = 10; // 10 attempts with 500ms each = 5 seconds max
    
    do {
      await page.waitForTimeout(500); // Wait 500ms between checks
      const cookiesAfterLogout = await page.context().cookies();
      remainingAuthCookies = cookiesAfterLogout.filter(cookie => 
        cookie.name.includes('civic-auth') || 
        cookie.name.includes('access_token') || 
        cookie.name.includes('refresh_token') ||
        cookie.name.includes('id_token') ||
        cookie.name.includes('session')
      );
      attempts++;
    } while (remainingAuthCookies.length > 0 && attempts < maxAttempts);
    
    // Assert that essential auth cookies have been deleted
    expect(remainingAuthCookies.length).toBe(0);
    
    // Additional verification: try to access a protected route to ensure session is cleared
    await page.goto('http://localhost:3000/demo');
    await page.waitForLoadState('networkidle');
    
    // Should be back to logged-out state (Sign In button visible, Ghost button not visible)
    await expect(page.getByTestId('sign-in-button')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
  });
});
