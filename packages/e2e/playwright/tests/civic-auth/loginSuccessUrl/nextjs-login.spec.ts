import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { setupDiagnostics } from '../../../utils/test-helpers';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    setupDiagnostics(page);
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login SuccessUrl');
    await allure.feature('Next.js Login (LoginSuccessUrl)');
  });
  test('should complete full login and logout flow with custom loginSuccessUrl', async ({ page, browserName }) => {
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
    
    // Wait for iframe to be present in DOM (don't care if it's visible or hidden)
    await page.waitForSelector('#civic-auth-iframe', { state: 'attached', timeout: 30000 });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Look for the dummy button with extended timeout
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 60000 });
  
    // Wait for the custom success route to load (indicating redirect happened)
    await expect(page.getByTestId('loginSuccessUrlHeader')).toBeVisible({ timeout: 20000 });
    
    // Verify custom loginSuccessUrl is loaded - should redirect to /customSuccessRoute
    await expect(page.url()).toContain('/customSuccessRoute');
    
    // Confirm logged in state by checking for Ghost button in dropdown
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });

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
    await page.locator('#civic-dropdown-container').locator('button:has-text("Log out")').click();
    
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
    
    // Additional verification: try to access the home route to ensure session is cleared
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Should be back to logged-out state (Sign In button visible, Ghost button not visible)
    await expect(page.getByTestId('sign-in-button')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
  });
});
