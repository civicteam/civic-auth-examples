import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { loginWithDummy } from '../../../utils/login-helper';
test.describe('Session Rehydration - NextJS', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Session Rehydration');
    await allure.feature('NextJS Session Rehydration');
  });

  test('should rehydrate session via middleware on page reload', async ({ page }) => {
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes

    // Background: User logs in and creates a valid session
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    await loginWithDummy(page);
  
    // Confirm logged in state by checking for Ghost button in dropdown
    const ghostButtonLocator = page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")');
    await expect(ghostButtonLocator).toBeVisible({ timeout: 20000 });
    
    // Fetch tokens from cookies - store original token values before manipulation
    const originalCookies = await page.context().cookies();
    const originalTokens = {
      access_token: originalCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: originalCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: originalCookies.find(cookie => cookie.name === 'refresh_token')?.value,
    };
    
    // Verify we have all required tokens
    expect(originalTokens.access_token).toBeTruthy();
    expect(originalTokens.id_token).toBeTruthy();
    expect(originalTokens.refresh_token).toBeTruthy();

    // Delete id_token and access_token cookies but keep refresh_token
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
    
    // Save the current refresh_token cookie value
    const savedRefreshToken = originalTokens.refresh_token;
    
    // Reload the page to trigger middleware session rehydration
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait for any refresh logic to complete
    await page.waitForTimeout(3000);
    
    // Verify tokens were rehydrated
    const rehydratedCookies = await page.context().cookies();
    const rehydratedTokens = {
      access_token: rehydratedCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: rehydratedCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: rehydratedCookies.find(cookie => cookie.name === 'refresh_token')?.value,
    };
    
    // Verify the id_token cookie should exist
    expect(rehydratedTokens.id_token).toBeTruthy();
    
    // Verify the access_token cookie should exist
    expect(rehydratedTokens.access_token).toBeTruthy();
    
    // Verify the refresh_token cookie should have changed
    expect(rehydratedTokens.refresh_token).toBeTruthy();
    expect(rehydratedTokens.refresh_token).not.toBe(savedRefreshToken);
    
    // Verify we're still logged in by checking for Ghost button
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
  });

  test('should rehydrate session via API call', async ({ page }) => {
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes

    // Background: User logs in and creates a valid session
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    await loginWithDummy(page);
  
    // Confirm logged in state by checking for Ghost button in dropdown
    const ghostButtonLocator = page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")');
    await expect(ghostButtonLocator).toBeVisible({ timeout: 20000 });
    
    // Fetch tokens from cookies - store original token values before manipulation
    const originalCookies = await page.context().cookies();
    const originalTokens = {
      access_token: originalCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: originalCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: originalCookies.find(cookie => cookie.name === 'refresh_token')?.value,
    };
    
    // Verify we have all required tokens
    expect(originalTokens.access_token).toBeTruthy();
    expect(originalTokens.id_token).toBeTruthy();
    expect(originalTokens.refresh_token).toBeTruthy();
    

    // Delete id_token and access_token cookies but keep refresh_token
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
    
    
    // Save the current refresh_token cookie value
    const savedRefreshToken = originalTokens.refresh_token;
    
    // Make an API call to simulate "fetch fake session" functionality
    const response = await page.request.get('http://localhost:3000/api/session/get');
    
    
    // Wait for the API call to complete and tokens to be refreshed
    await page.waitForTimeout(2000);
    
    // Verify tokens were rehydrated
    const rehydratedCookies = await page.context().cookies();
    const rehydratedTokens = {
      access_token: rehydratedCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: rehydratedCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: rehydratedCookies.find(cookie => cookie.name === 'refresh_token')?.value,
    };
    
    
    // Verify the id_token cookie should exist
    expect(rehydratedTokens.id_token).toBeTruthy();
    
    // Verify the access_token cookie should exist
    expect(rehydratedTokens.access_token).toBeTruthy();
    
    // Verify the refresh_token cookie should have changed
    expect(rehydratedTokens.refresh_token).toBeTruthy();
    expect(rehydratedTokens.refresh_token).not.toBe(savedRefreshToken);
    
    // Verify we're still logged in by checking for Ghost button
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
  });
});
