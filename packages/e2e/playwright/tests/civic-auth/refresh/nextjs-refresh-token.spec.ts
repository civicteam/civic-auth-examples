import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { setupDiagnostics } from '../../../utils/test-helpers';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    setupDiagnostics(page);
    await allure.epic('Civic Auth Applications');
    await allure.suite('Refresh Token');
    await allure.feature('Next.js Refresh Token Flow');
  });

  test('should handle refresh token flow correctly', async ({ page, browserName }) => {
    setupDiagnostics(page);
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
    
    // Store original token values before manipulation
    const originalCookies = await page.context().cookies();
    const originalTokens = {
      user: originalCookies.find(cookie => cookie.name === 'user')?.value,
      access_token: originalCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: originalCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: originalCookies.find(cookie => cookie.name === 'refresh_token')?.value,
      oidc_session_expires_at: originalCookies.find(cookie => cookie.name === 'oidc_session_expires_at')?.value,
    };
    
    // Verify we have all required tokens
    expect(originalTokens.user).toBeTruthy();
    expect(originalTokens.access_token).toBeTruthy();
    expect(originalTokens.id_token).toBeTruthy();
    expect(originalTokens.refresh_token).toBeTruthy();
    expect(originalTokens.oidc_session_expires_at).toBeTruthy();
    
    console.log('Original tokens captured:', {
      user: originalTokens.user?.substring(0, 20) + '...',
      access_token: originalTokens.access_token?.substring(0, 20) + '...',
      id_token: originalTokens.id_token?.substring(0, 20) + '...',
      refresh_token: originalTokens.refresh_token?.substring(0, 20) + '...',
      oidc_session_expires_at: originalTokens.oidc_session_expires_at,
    });
    
    // Delete user, access_token, and id_token cookies while keeping refresh_token
    await page.context().clearCookies();
    
    // Set only the refresh_token cookie back
    await page.context().addCookies([
      {
        name: 'refresh_token',
        value: originalTokens.refresh_token!,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);
    
    // Set oidc_session_expires_at to a past value (expired)
    await page.context().addCookies([
      {
        name: 'oidc_session_expires_at',
        value: '10', // Past timestamp
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);
    
    console.log('Tokens manipulated: deleted user, access_token, id_token; kept refresh_token; set oidc_session_expires_at to past');
    
    // Refresh the page to trigger token refresh flow
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait for any refresh logic to complete
    await page.waitForTimeout(3000);
    
    // Get cookies after refresh
    const refreshedCookies = await page.context().cookies();
    const refreshedTokens = {
      user: refreshedCookies.find(cookie => cookie.name === 'user')?.value,
      access_token: refreshedCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: refreshedCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: refreshedCookies.find(cookie => cookie.name === 'refresh_token')?.value,
      oidc_session_expires_at: refreshedCookies.find(cookie => cookie.name === 'oidc_session_expires_at')?.value,
    };
    
    console.log('Refreshed tokens:', {
      user: refreshedTokens.user?.substring(0, 20) + '...',
      access_token: refreshedTokens.access_token?.substring(0, 20) + '...',
      id_token: refreshedTokens.id_token?.substring(0, 20) + '...',
      refresh_token: refreshedTokens.refresh_token?.substring(0, 20) + '...',
      oidc_session_expires_at: refreshedTokens.oidc_session_expires_at,
    });
    
    // Verify refresh token is different from the original
    expect(refreshedTokens.refresh_token).toBeTruthy();
    expect(refreshedTokens.refresh_token).not.toBe(originalTokens.refresh_token);
    console.log('✅ Refresh token has been renewed');
    
    // Verify oidc_session_expires_at is now in the future (greater than current timestamp)
    expect(refreshedTokens.oidc_session_expires_at).toBeTruthy();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const newExpiresAt = parseInt(refreshedTokens.oidc_session_expires_at!);
    expect(newExpiresAt).toBeGreaterThan(currentTimestamp);
    console.log('✅ oidc_session_expires_at has been set to future:', new Date(newExpiresAt * 1000));
    
    // Verify user, access_token, and id_token are present and different from original
    expect(refreshedTokens.user).toBeTruthy();
    expect(refreshedTokens.access_token).toBeTruthy();
    expect(refreshedTokens.id_token).toBeTruthy();
    
    expect(refreshedTokens.user).not.toBe(originalTokens.user);
    expect(refreshedTokens.access_token).not.toBe(originalTokens.access_token);
    expect(refreshedTokens.id_token).not.toBe(originalTokens.id_token);
    
    console.log('✅ user, access_token, and id_token tokens are present and renewed');
    
    // Verify we're still logged in by checking for Ghost button
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
    console.log('✅ User remains authenticated after token refresh');
  });
});
