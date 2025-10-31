import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
test.describe('Session Rehydration - VanillaJS', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Session Rehydration');
    await allure.feature('VanillaJS Session Rehydration');
  });

  test('should rehydrate session via middleware on page reload', async ({ page }) => {
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes

    // Background: User logs in and creates a valid session
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click "Try Embedded Mode" to navigate to the embedded page
    await page.click('#startAuthButton');
    
    // Wait for the embedded page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for iframe to appear and load inside the authContainer
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#iframeContainer #civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { state: 'hidden', timeout: 30000 });

    // Check that we're logged in by verifying the embedded status shows success
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toContainText('Ghost');
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toHaveClass(/success/);
    
    // Fetch tokens from cookies - store original token values before manipulation
    const originalCookies = await page.context().cookies();
    const originalTokens = {
      access_token: originalCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: originalCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: originalCookies.find(cookie => cookie.name === 'refresh_token')?.value,
    };
    
    // For VanillaJS, tokens might be in localStorage instead of cookies
    let tokensFromStorage: any = {};
    if (!originalTokens.access_token || !originalTokens.id_token || !originalTokens.refresh_token) {
      tokensFromStorage = await page.evaluate(() => {
        return {
          access_token: localStorage.getItem('access_token'),
          id_token: localStorage.getItem('id_token'),
          refresh_token: localStorage.getItem('refresh_token'),
        };
      });
    }
    
    // Use cookies if available, otherwise localStorage
    const tokens = {
      access_token: originalTokens.access_token || tokensFromStorage.access_token,
      id_token: originalTokens.id_token || tokensFromStorage.id_token,
      refresh_token: originalTokens.refresh_token || tokensFromStorage.refresh_token,
    };
    
    // Verify we have all required tokens
    expect(tokens.access_token).toBeTruthy();
    expect(tokens.id_token).toBeTruthy();
    expect(tokens.refresh_token).toBeTruthy();
    

    // Delete id_token and access_token but keep refresh_token
    if (originalTokens.access_token || originalTokens.id_token) {
      // Working with cookies
      await page.context().clearCookies();
      
      // Set only the refresh_token cookie back
      if (tokens.refresh_token) {
        await page.context().addCookies([
          {
            name: 'refresh_token',
            value: tokens.refresh_token,
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax'
          }
        ]);
      }
    } else {
      // Working with localStorage
      await page.evaluate(() => {
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        // Keep refresh_token in localStorage
      });
    }
    
    
    // Save the current refresh_token value
    const savedRefreshToken = tokens.refresh_token;
    
    // Reload the page to trigger session rehydration
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait for any refresh logic to complete
    await page.waitForTimeout(3000);
    
    // Verify tokens were rehydrated
    let rehydratedTokens: any = {};
    
    // Check cookies first
    const rehydratedCookies = await page.context().cookies();
    rehydratedTokens = {
      access_token: rehydratedCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: rehydratedCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: rehydratedCookies.find(cookie => cookie.name === 'refresh_token')?.value,
    };
    
    // If not in cookies, check localStorage
    if (!rehydratedTokens.access_token || !rehydratedTokens.id_token) {
      const storageTokens = await page.evaluate(() => {
        return {
          access_token: localStorage.getItem('access_token'),
          id_token: localStorage.getItem('id_token'),
          refresh_token: localStorage.getItem('refresh_token'),
        };
      });
      
      rehydratedTokens = {
        access_token: rehydratedTokens.access_token || storageTokens.access_token,
        id_token: rehydratedTokens.id_token || storageTokens.id_token,
        refresh_token: rehydratedTokens.refresh_token || storageTokens.refresh_token,
      };
    }
    
    
    // Verify the id_token should exist
    expect(rehydratedTokens.id_token).toBeTruthy();
    
    // Verify the access_token should exist
    expect(rehydratedTokens.access_token).toBeTruthy();
    
    // Verify the refresh_token should have changed
    expect(rehydratedTokens.refresh_token).toBeTruthy();
    expect(rehydratedTokens.refresh_token).not.toBe(savedRefreshToken);
    
    // Verify we're still logged in by checking the embedded status
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toContainText('Ghost');
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toHaveClass(/success/);
  });

  test('should rehydrate session via API call', async ({ page }) => {
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes

    // Background: User logs in and creates a valid session
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click "Try Embedded Mode" to navigate to the embedded page
    await page.click('#startAuthButton');
    
    // Wait for the embedded page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for iframe to appear and load inside the authContainer
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#iframeContainer #civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { state: 'hidden', timeout: 30000 });

    // Check that we're logged in by verifying the embedded status shows success
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toContainText('Ghost');
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toHaveClass(/success/);
    
    // Fetch tokens from cookies/localStorage - store original token values before manipulation
    const originalCookies = await page.context().cookies();
    const originalTokens = {
      access_token: originalCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: originalCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: originalCookies.find(cookie => cookie.name === 'refresh_token')?.value,
    };
    
    // For VanillaJS, tokens might be in localStorage instead of cookies
    let tokensFromStorage: any = {};
    if (!originalTokens.access_token || !originalTokens.id_token || !originalTokens.refresh_token) {
      tokensFromStorage = await page.evaluate(() => {
        return {
          access_token: localStorage.getItem('access_token'),
          id_token: localStorage.getItem('id_token'),
          refresh_token: localStorage.getItem('refresh_token'),
        };
      });
    }
    
    // Use cookies if available, otherwise localStorage
    const tokens = {
      access_token: originalTokens.access_token || tokensFromStorage.access_token,
      id_token: originalTokens.id_token || tokensFromStorage.id_token,
      refresh_token: originalTokens.refresh_token || tokensFromStorage.refresh_token,
    };
    
    // Verify we have all required tokens
    expect(tokens.access_token).toBeTruthy();
    expect(tokens.id_token).toBeTruthy();
    expect(tokens.refresh_token).toBeTruthy();
    

    // Delete id_token and access_token but keep refresh_token
    if (originalTokens.access_token || originalTokens.id_token) {
      // Working with cookies
      await page.context().clearCookies();
      
      // Set only the refresh_token cookie back
      if (tokens.refresh_token) {
        await page.context().addCookies([
          {
            name: 'refresh_token',
            value: tokens.refresh_token,
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax'
          }
        ]);
      }
    } else {
      // Working with localStorage
      await page.evaluate(() => {
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        // Keep refresh_token in localStorage
      });
    }
    
    
    // Save the current refresh_token value
    const savedRefreshToken = tokens.refresh_token;
    
    // Click the "Test Refresh Token Restore (SPA)" button which simulates fetch-fake-session
    const refreshButton = page.locator('[data-testid="vanilla-js-test-refresh-restore-button"]');
    await refreshButton.waitFor({ state: 'visible', timeout: 10000 });
    await refreshButton.click();
    
    // Wait for the refresh operation to complete
    await page.waitForTimeout(5000);
    
    // Verify tokens were rehydrated
    let rehydratedTokens: any = {};
    
    // Check cookies first
    const rehydratedCookies = await page.context().cookies();
    rehydratedTokens = {
      access_token: rehydratedCookies.find(cookie => cookie.name === 'access_token')?.value,
      id_token: rehydratedCookies.find(cookie => cookie.name === 'id_token')?.value,
      refresh_token: rehydratedCookies.find(cookie => cookie.name === 'refresh_token')?.value,
    };
    
    // If not in cookies, check localStorage
    if (!rehydratedTokens.access_token || !rehydratedTokens.id_token) {
      const storageTokens = await page.evaluate(() => {
        return {
          access_token: localStorage.getItem('access_token'),
          id_token: localStorage.getItem('id_token'),
          refresh_token: localStorage.getItem('refresh_token'),
        };
      });
      
      rehydratedTokens = {
        access_token: rehydratedTokens.access_token || storageTokens.access_token,
        id_token: rehydratedTokens.id_token || storageTokens.id_token,
        refresh_token: rehydratedTokens.refresh_token || storageTokens.refresh_token,
      };
    }
    
    
    // Verify the id_token should exist
    expect(rehydratedTokens.id_token).toBeTruthy();
    
    // Verify the access_token should exist
    expect(rehydratedTokens.access_token).toBeTruthy();
    
    // Verify the refresh_token should have changed
    expect(rehydratedTokens.refresh_token).toBeTruthy();
    expect(rehydratedTokens.refresh_token).not.toBe(savedRefreshToken);
    
    // Verify we're still logged in by checking the embedded status
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toContainText('Ghost');
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toHaveClass(/success/);
  });
});
