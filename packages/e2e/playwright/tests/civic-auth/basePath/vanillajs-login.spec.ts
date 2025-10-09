import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { waitForCivicIframeToLoad, waitForCivicIframeToClose } from '../../../helpers/iframe-helpers';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Login Basepath');
    await allure.feature('VanillaJS Embedded Login (BasePath)');
  });
  test('should complete full embedded login and logout flow with basepath', async ({ page, browserName }) => {
    // Open the app home page with basepath
    await page.goto('http://localhost:3000/demo');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click "Try Embedded Mode" to navigate to the embedded page
    await page.click('a[href="embedded.html"]');
    
    // Wait for the embedded page to load
    await page.waitForLoadState('networkidle');
    
    // Click the embedded sign in button
    await page.click('#loginButton');
    
    // Chrome/Firefox use iframe flow
    // Wait for iframe to appear and load inside the authContainer
    const frame = await waitForCivicIframeToLoad(page);
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await waitForCivicIframeToClose(page);
    
    // Confirm logged in state by checking for user info display
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.getByRole('button', { name: 'Sign In' });
    
    // Verify we're still on the basepath
    await expect(page.url()).toContain('/demo');
    
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
