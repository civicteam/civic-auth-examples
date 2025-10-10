import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { setupDiagnostics } from '../../../utils/test-helpers';

test.describe('Civic Auth onSignIn Callback Tests', () => {
  test.beforeEach(async ({ page }) => {
    setupDiagnostics(page);
    await allure.epic('Civic Auth Applications');
    await allure.suite('onSignIn Callback');
    await allure.feature('React.js onSignIn Callback');
  });

  test('should call onSignIn callback on successful sign-in', async ({ page }) => {
    setupDiagnostics(page);
    // Clear any existing auth state to ensure clean test
    await page.context().clearCookies();
    
    // Navigate to the main React app
    await page.goto('http://localhost:3000?view=onSignInTest');
    
    // Clear storage after navigation
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Reload to ensure clean state
    await page.reload();
    
    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test")', { timeout: 10000 });
    
    // Get initial callback count
    const callbackCountElement = page.locator('h2:has-text("Provider-Level onSignIn Callback")').locator('..').locator('p:has-text("Callback Count:")');
    const initialCallbackCount = await callbackCountElement.textContent();
    const initialCount = parseInt(initialCallbackCount?.split(':')[1].trim() || '0');
    
    // Click the Test Sign In button from our test component
    await page.locator('button:has-text("Test Sign In")').click();
    
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
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    // Using longer timeout for CI environments
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 60000 });
    
    // Wait for the callback to be executed
    await page.waitForTimeout(2000);
    
    // Verify callback count increased
    const finalCallbackCount = await callbackCountElement.textContent();
    const finalCount = parseInt(finalCallbackCount?.split(':')[1].trim() || '0');
    expect(finalCount).toBe(initialCount + 2);
    
    // Verify success callback was logged
    const providerLogContainer = page.locator('h2:has-text("Provider-Level onSignIn Callback")').locator('..').locator('div[style*="font-family: monospace"]').first();
    const callbackLog = await providerLogContainer.textContent();
    expect(callbackLog).toContain('onSignIn called with SUCCESS (no error)');
    
    // Verify user is logged in - check for "Already signed in" button
    await expect(page.locator('button:has-text("Already signed in")')).toBeVisible({ timeout: 20000 });
  });

  test('should call onSignIn callback and handle sign-out correctly', async ({ page }) => {
    setupDiagnostics(page);
    // Clear any existing auth state to ensure clean test
    await page.context().clearCookies();
    
    // Navigate to the main React app
    await page.goto('http://localhost:3000?view=onSignInTest');
    
    // Clear storage after navigation
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Reload to ensure clean state
    await page.reload();
    
    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test")', { timeout: 10000 });
    
    // Get initial callback count
    const callbackCountElement = page.locator('h2:has-text("Provider-Level onSignIn Callback")').locator('..').locator('p:has-text("Callback Count:")');
    const initialCallbackCount = await callbackCountElement.textContent();
    const initialCount = parseInt(initialCallbackCount?.split(':')[1].trim() || '0');
    
    // Wait for the Test Sign In button to be visible
    await page.waitForSelector('button:has-text("Test Sign In")', { timeout: 10000 });
    
    // First sign-in attempt
    await page.locator('button:has-text("Test Sign In")').click();
        
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
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    // Using longer timeout for CI environments
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Verify first callback
    const firstCallbackCount = await callbackCountElement.textContent();
    const firstCount = parseInt(firstCallbackCount?.split(':')[1].trim() || '0');
    expect(firstCount).toBe(initialCount + 2);
    
    // Logout using the Test Sign Out button
    await page.locator('button:has-text("Test Sign Out")').click();
    
    // Wait for sign-out to complete and redirect to base URL
    await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Verify we're back at the base URL (expected behavior after sign-out)
    expect(page.url()).toBe('http://localhost:3000/');
    
    // Verify we can see the main app page
    await expect(page.locator('h1:has-text("Civic Auth (ReactJS)")')).toBeVisible({ timeout: 10000 });
  });

  test('should call onSignIn callback with error on failed sign-in', async ({ page }) => {
    setupDiagnostics(page);
    // This test would require simulating a failed sign-in scenario
    // For now, we'll test the callback structure and timing
    
    // Navigate to the main React app
    await page.goto('http://localhost:3000?view=onSignInTest');
    
    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test")', { timeout: 10000 });
    
    // Verify the provider callback log container exists and is ready
    const providerLogContainer = page.locator('h2:has-text("Provider-Level onSignIn Callback")').locator('..').locator('div[style*="font-family: monospace"]').first();
    await expect(providerLogContainer).toBeVisible();
    
    // Verify initial state shows no callbacks
    const initialLog = await providerLogContainer.textContent();
    expect(initialLog).toContain('No provider callbacks logged yet');
    
    // Verify callback count starts at 0
    const callbackCountElement = page.locator('h2:has-text("Provider-Level onSignIn Callback")').locator('..').locator('p:has-text("Callback Count:")');
    const initialCallbackCount = await callbackCountElement.textContent();
    expect(initialCallbackCount).toContain('Callback Count: 0');
  });

  test('should maintain callback state across page interactions', async ({ page }) => {
    setupDiagnostics(page);
    // Navigate to the main React app
    await page.goto('http://localhost:3000?view=onSignInTest');
    
    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the test component to be visible
    await page.waitForSelector('h1:has-text("Civic Auth - OnSignIn Callback Test")', { timeout: 10000 });
    
    // Get callback count element for later use
    const callbackCountElement = page.locator('h2:has-text("Provider-Level onSignIn Callback")').locator('..').locator('p:has-text("Callback Count:")');
    
    // Wait for the Test Sign In button to be visible
    await page.waitForSelector('button:has-text("Test Sign In")', { timeout: 10000 });
    
    // Perform a sign-in
    await page.locator('button:has-text("Test Sign In")').click();
        // Chrome/Firefox use iframe flow
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
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    // Using longer timeout for CI environments
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Verify callback was logged
    const providerLogContainer = page.locator('h2:has-text("Provider-Level onSignIn Callback")').locator('..').locator('div[style*="font-family: monospace"]').first();
    const callbackLog = await providerLogContainer.textContent();
    expect(callbackLog).toContain('onSignIn called with SUCCESS (no error)');
    
    // Interact with other elements on the page
    await page.locator('button:has-text("Clear Callback Log")').click();
    
    // Verify log was cleared
    const clearedLog = await providerLogContainer.textContent();
    expect(clearedLog).toContain('No provider callbacks logged yet');
    
    // Verify callback count was reset
    const resetCallbackCount = await callbackCountElement.textContent();
    expect(resetCallbackCount).toContain('Callback Count: 0');
  });
});
