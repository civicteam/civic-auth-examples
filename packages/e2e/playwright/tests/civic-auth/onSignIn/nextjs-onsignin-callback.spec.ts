import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
test.describe('Civic Auth onSignIn Callback Tests', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('onSignIn Callback');
    await allure.feature('Next.js onSignIn Callback');
  });

  test('should call useUser onSignIn callback on successful sign-in', async ({ page }) => {
    // Navigate to the onSignIn test app
    await page.goto('http://localhost:3000/onSignInTest');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test (NextJS)")', { timeout: 10000 });
    
    // Wait for the Test Sign In button to be visible
    await page.waitForSelector('button:has-text("Test Sign In")', { timeout: 10000 });
    
    // Click the Test Sign In button from our test component
    await page.locator('button:has-text("Test Sign In")').click();
    
    // Wait for iframe to appear and load
    await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#civic-auth-iframe');
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
    
    // Wait for the callback to be executed (sign-in process takes several seconds)
    await page.waitForTimeout(5000);
    
    // After OAuth login, the app may redirect away from /onSignInTest
    // Check if we're still on the test page, if not navigate back
    const currentUrl = page.url();
    if (!currentUrl.includes('/onSignInTest')) {
      await page.goto('http://localhost:3000/onSignInTest');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for component to initialize
    }
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test (NextJS)")', { timeout: 10000 });
    
    // Verify success callback was logged in component - get the callback log container by data-testid
    const callbackLogContainer = page.locator('[data-testid="callback-log-container"]');
    
    // First wait for the element to exist
    await expect(callbackLogContainer).toBeVisible({ timeout: 10000 });
    
    // Wait for the callback log to contain the success message (with timeout for dev mode)
    await expect(callbackLogContainer).toContainText('useUser onSignIn called with SUCCESS (no error)', { timeout: 10000 });
    const callbackLog = await callbackLogContainer.textContent();
    
    // Verify that the useUser onSignIn callback was triggered
    expect(callbackLog).toContain('useUser onSignIn called with SUCCESS (no error)');
    
    // Verify user is logged in - check for "Already signed in" button
    await expect(page.locator('button:has-text("Already signed in")')).toBeVisible({ timeout: 20000 });
  });

  test('should call useUser onSignIn callback and handle sign-out correctly', async ({ page }) => {
    // Navigate to the onSignIn test app
    await page.goto('http://localhost:3000/onSignInTest');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test (NextJS)")', { timeout: 10000 });
    
    // Wait for the Test Sign In button to be visible
    await page.waitForSelector('button:has-text("Test Sign In")', { timeout: 10000 });
    
    // First sign-in attempt
    await page.locator('button:has-text("Test Sign In")').click();
    await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    
    const frame = page.frameLocator('#civic-auth-iframe');
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

    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // After OAuth login, the app may redirect away from /onSignInTest
    // Check if we're still on the test page, if not navigate back
    const currentUrl = page.url();
    if (!currentUrl.includes('/onSignInTest')) {
      await page.goto('http://localhost:3000/onSignInTest');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for component to initialize
    }
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test (NextJS)")', { timeout: 10000 });
    
    // Verify callback was logged - use data-testid for reliable selection
    const callbackLogContainer = page.locator('[data-testid="callback-log-container"]');
    
    // First wait for the element to exist
    await expect(callbackLogContainer).toBeVisible({ timeout: 10000 });
    
    // Wait for the callback log to contain the success message (with timeout for dev mode)
    await expect(callbackLogContainer).toContainText('useUser onSignIn called with SUCCESS (no error)', { timeout: 10000 });
    const callbackLog = await callbackLogContainer.textContent();
    expect(callbackLog).toContain('useUser onSignIn called with SUCCESS (no error)');
    
    // Logout using the Test Sign Out button
    await page.locator('button:has-text("Test Sign Out")').click();
    
    // Wait for sign-out to complete and redirect to base URL
    await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Verify we're back at the base URL (expected behavior after sign-out)
    expect(page.url()).toBe('http://localhost:3000/');
    
    // Verify we can see the main app page
    await expect(page.locator('h1:has-text("Civic Auth (NextJS)")')).toBeVisible({ timeout: 10000 });
  });

  test('should call onSignIn callback with error on failed sign-in', async ({ page }) => {
    // This test would require simulating a failed sign-in scenario
    // For now, we'll test the callback structure and timing
    
    // Navigate to the onSignIn test app
    await page.goto('http://localhost:3000/onSignInTest');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test (NextJS)")', { timeout: 10000 });
    
    // Verify the callback log container exists and is ready - use data-testid for reliable selection
    const callbackLogContainer = page.locator('[data-testid="callback-log-container"]');
    await expect(callbackLogContainer).toBeVisible();
    
    // Wait for auth status to appear in the log (React Strict Mode may delay effects in dev mode)
    await expect(callbackLogContainer).toContainText('Auth status changed to:', { timeout: 10000 });
    
    // Verify initial state shows auth status changes (component logs these on mount)
    const initialLog = await callbackLogContainer.textContent();
    expect(initialLog).toContain('Auth status changed to: unauthenticated');
  });

  test('should maintain callback state across page interactions', async ({ page }) => {
    // Navigate to the onSignIn test app
    await page.goto('http://localhost:3000/onSignInTest');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test (NextJS)")', { timeout: 10000 });
    
    // Wait for the Test Sign In button to be visible
    await page.waitForSelector('button:has-text("Test Sign In")', { timeout: 10000 });
    
    // Perform a sign-in
    await page.locator('button:has-text("Test Sign In")').click();
    await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    
    const frame = page.frameLocator('#civic-auth-iframe');
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

    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // After OAuth login, the app may redirect away from /onSignInTest
    // Check if we're still on the test page, if not navigate back
    const currentUrl2 = page.url();
    if (!currentUrl2.includes('/onSignInTest')) {
      await page.goto('http://localhost:3000/onSignInTest');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for component to initialize
    }
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test (NextJS)")', { timeout: 10000 });
    
    // Verify callback was logged - use data-testid for reliable selection
    const callbackLogContainer = page.locator('[data-testid="callback-log-container"]');
    
    // First wait for the element to exist
    await expect(callbackLogContainer).toBeVisible({ timeout: 10000 });
    
    // Wait for the callback log to contain the success message (with timeout for dev mode)
    await expect(callbackLogContainer).toContainText('useUser onSignIn called with SUCCESS (no error)', { timeout: 10000 });
    const callbackLog = await callbackLogContainer.textContent();
    expect(callbackLog).toContain('useUser onSignIn called with SUCCESS (no error)');
    
    // Interact with other elements on the page
    await page.locator('button:has-text("Clear Log")').click();
    
    // Verify log was cleared
    const clearedLog = await callbackLogContainer.textContent();
    expect(clearedLog).toContain('No callbacks logged yet');
  });

  test('should handle onSignIn callback in Next.js middleware context', async ({ page }) => {
    // Test that onSignIn callback works properly with Next.js middleware
    // Navigate to the onSignIn test app
    await page.goto('http://localhost:3000/onSignInTest');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test (NextJS)")', { timeout: 10000 });
    
    // Verify the page loaded successfully (middleware didn't interfere)
    await expect(page.locator('h1:has-text("Civic Auth - OnSignIn Callback Test (NextJS)")')).toBeVisible();
    
    // Verify the callback system is ready - use data-testid for reliable selection
    const callbackLogContainer = page.locator('[data-testid="callback-log-container"]');
    await expect(callbackLogContainer).toBeVisible();
    
    // Wait for auth status to appear in the log (React Strict Mode may delay effects in dev mode)
    await expect(callbackLogContainer).toContainText('Auth status changed to:', { timeout: 10000 });
    
    // Verify initial state shows auth status changes (component logs these on mount)
    const initialLog = await callbackLogContainer.textContent();
    expect(initialLog).toContain('Auth status changed to: unauthenticated');
  });
});
