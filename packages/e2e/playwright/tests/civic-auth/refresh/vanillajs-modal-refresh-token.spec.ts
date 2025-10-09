import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { setupDiagnostics } from '../../utils/test-helpers';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Refresh Token');
    await allure.feature('VanillaJS Modal Refresh Token Flow');
  });

  test('should handle refresh token flow correctly in modal mode', async ({ page, browserName }) => {
    // Setup diagnostic monitoring for CI debugging
    setupDiagnostics(page, 'vanillajs-modal-refresh-token');
    
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes

    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click "Try Embedded Mode" to navigate to the embedded page
    await page.click('#startAuthModalButton');
    
    // Wait for the embedded page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for iframe to appear and load inside the authContainer
    await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 60000 });

    // Check that we're logged in by verifying the embedded status shows success
    await expect(page.locator('[data-testid="vanilla-js-modal-status"]')).toContainText('Ghost');
    await expect(page.locator('[data-testid="vanilla-js-modal-status"]')).toHaveClass(/success/);
    
    // Store original token values from localStorage before manipulation
    const originalTokens = await page.evaluate(() => {
      return {
        user: localStorage.getItem('user'),
        access_token: localStorage.getItem('access_token'),
        id_token: localStorage.getItem('id_token'),
        refresh_token: localStorage.getItem('refresh_token'),
        oidc_session_expires_at: localStorage.getItem('oidc_session_expires_at'),
      };
    });
    
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
    
    // Delete user, access_token, and id_token from localStorage while keeping refresh_token
    // Set oidc_session_expires_at to a past value (expired)
    await page.evaluate((tokens) => {
      // Delete the specified tokens
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      
      // Keep refresh_token (don't delete it)
      // Set oidc_session_expires_at to past value
      localStorage.setItem('oidc_session_expires_at', '10');
      
      console.log('Tokens manipulated: deleted user, access_token, id_token; kept refresh_token; set oidc_session_expires_at to past');
    }, originalTokens);
    
    // Refresh the page to trigger token refresh flow
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait for any refresh logic to complete
    await page.waitForTimeout(3000);
    
    // Get tokens from localStorage after refresh
    const refreshedTokens = await page.evaluate(() => {
      return {
        user: localStorage.getItem('user'),
        access_token: localStorage.getItem('access_token'),
        id_token: localStorage.getItem('id_token'),
        refresh_token: localStorage.getItem('refresh_token'),
        oidc_session_expires_at: localStorage.getItem('oidc_session_expires_at'),
      };
    });
    
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
    
    // Verify we're still logged in by checking the modal status
    await expect(page.locator('[data-testid="vanilla-js-modal-status"]')).toContainText('Ghost');
    await expect(page.locator('[data-testid="vanilla-js-modal-status"]')).toHaveClass(/success/);
    console.log('✅ User remains authenticated after token refresh');
  });
});
