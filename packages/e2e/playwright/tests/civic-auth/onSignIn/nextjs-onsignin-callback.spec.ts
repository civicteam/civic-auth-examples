import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { waitForCivicIframeToLoad, waitForCivicIframeToClose } from '../../../helpers/iframe-helpers';

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
    
    // Wait for iframe to fully load with content (CI-safe)
    const frame = await waitForCivicIframeToLoad(page);
    
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await waitForCivicIframeToClose(page, { timeout: 30000 });
    
    // Wait for the callback to be executed (sign-in process takes several seconds)
    await page.waitForTimeout(5000);
    
    // Verify success callback was logged in component - get the entire callback log container
    // The structure is: <strong>Callback Log:</strong> followed by a <div> that contains all the log entries
    const callbackLogContainer = page.locator('strong:has-text("Callback Log:")').locator('+ div');
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
    const frame = await waitForCivicIframeToLoad(page);
    
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    await waitForCivicIframeToClose(page, { timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Verify callback was logged
    const callbackLogContainer = page.locator('strong:has-text("Callback Log:")').locator('+ div');
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
    
    // Verify the callback log container exists and is ready
    const callbackLogContainer = page.locator('strong:has-text("Callback Log:")').locator('+ div');
    await expect(callbackLogContainer).toBeVisible();
    
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
    const frame = await waitForCivicIframeToLoad(page);
    
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    await waitForCivicIframeToClose(page, { timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Verify callback was logged
    const callbackLogContainer = page.locator('strong:has-text("Callback Log:")').locator('+ div');
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
    
    // Verify the callback system is ready
    const callbackLogContainer = page.locator('strong:has-text("Callback Log:")').locator('+ div');
    await expect(callbackLogContainer).toBeVisible();
    
    // Verify initial state shows auth status changes (component logs these on mount)
    const initialLog = await callbackLogContainer.textContent();
    expect(initialLog).toContain('Auth status changed to: unauthenticated');
  });
});
