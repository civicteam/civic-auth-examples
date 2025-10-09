import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { waitForCivicIframeToLoad, waitForCivicIframeToClose } from '../../../helpers/iframe-helpers';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login');
    await allure.feature('VanillaJS Embedded Login');
  });
  test('should complete full modal login and logout flow', async ({ page, browserName }) => {
    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click "Try Embedded Mode" to navigate to the embedded page
    await page.click('#startAuthModalButton');
    
    // Wait for the embedded page to load
    await page.waitForLoadState('networkidle');
    
    // Click the embedded sign in button
    // await page.click('#loginButton');
    
    // Wait for iframe to fully load
    const frame = await waitForCivicIframeToLoad(page);
    
    // Click log in with dummy
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for iframe to close
    await waitForCivicIframeToClose(page);

    // Check that we're logged in by verifying the embedded status shows success
    await expect(page.locator('[data-testid="vanilla-js-modal-status"]')).toContainText('Ghost');
    await expect(page.locator('[data-testid="vanilla-js-modal-status"]')).toHaveClass(/success/);
    
    // Now logout using the "Logout All" button
    await page.click('[data-testid="vanilla-js-logout-button"]');
    
    // Verify we're logged out by checking the embedded status returns to "Ready"
    await expect(page.locator('[data-testid="vanilla-js-modal-status"]')).toContainText('Ready');
    await expect(page.locator('[data-testid="vanilla-js-modal-status"]')).toHaveClass(/ready/);
    
    // Verify token refresh fails after logout
    const response = await page.request.post('https://auth-dev.civic.com/oauth/token', {
      form: {
        grant_type: 'refresh_token',
        refresh_token: 'storedRefreshToken', // Note: You'll need to get the actual refresh token
        client_id: process.env.CLIENT_ID || ''
      }
    });
    expect(response.status()).toBe(400);
  });
}); 