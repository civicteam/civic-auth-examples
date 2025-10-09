import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { setupDiagnostics } from '../../utils/test-helpers';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    setupDiagnostics(page);
    await allure.epic('Civic Auth Applications');
    await allure.suite('Stale Session Handling');
    await allure.feature('Next.js Stale Session Reinitialization');
  });

  test('should reinitialize authentication when session is stale (>30 minutes)', async ({ page, browserName }) => {
    setupDiagnostics(page);
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes

    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Manually set the civic_auth_authentication_started_at_seconds to a stale timestamp (30+ minutes ago)
    const staleTimestamp = Math.floor(Date.now() / 1000) - (31 * 60); // 31 minutes ago
    await page.evaluate((timestamp) => {
      localStorage.setItem('civic_auth_authentication_started_at_seconds', timestamp.toString());
      console.log('Set stale timestamp:', timestamp);
    }, staleTimestamp);
    
    console.log('✅ Set civic_auth_authentication_started_at_seconds to stale value:', staleTimestamp);
    
    // Wait for the sign in button to be visible and enabled/clickable
    const signInButton = page.getByTestId('sign-in-button');
    await signInButton.waitFor({ state: 'visible', timeout: 30000 });
    await expect(signInButton).toBeEnabled({ timeout: 10000 });
    
    // Set up network request monitoring to catch /login calls
    const loginRequests = [];
    const challengeRequests = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/login')) {
        loginRequests.push({
          url: url,
          method: request.method(),
          timestamp: Date.now()
        });
        console.log('🔍 Detected /login request:', url);
      }
      if (url.includes('/challenge')) {
        challengeRequests.push({
          url: url,
          method: request.method(),
          timestamp: Date.now()
        });
        console.log('🔍 Detected /challenge request:', url);
      }
    });
    
    // Click on Log in - this should trigger reinitialization due to stale session
    await signInButton.click();
    
    // Wait for iframe to appear (indicating auth flow started)
    await page.waitForSelector('#civic-auth-iframe', { state: 'attached', timeout: 30000 });
    
    // Wait a moment for network requests to complete
    await page.waitForTimeout(3000);
    
    // Verify that a new /login or /challenge call was made (indicating reinitialization)
    const hasLoginCall = loginRequests.length > 0;
    const hasChallengeCall = challengeRequests.length > 0;
    
    expect(hasLoginCall || hasChallengeCall).toBe(true);
    console.log('✅ Reinitialization triggered - Login calls:', loginRequests.length, 'Challenge calls:', challengeRequests.length);
    
    // Check that a new civic_auth_authentication_started_at_seconds timestamp was set
    const newTimestamp = await page.evaluate(() => {
      return localStorage.getItem('civic_auth_authentication_started_at_seconds');
    });
    
    expect(newTimestamp).toBeTruthy();
    expect(parseInt(newTimestamp!)).toBeGreaterThan(staleTimestamp);
    console.log('✅ New timestamp set after reinitialization:', newTimestamp);
    
    // Verify the new timestamp is recent (within last few seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - parseInt(newTimestamp!);
    expect(timeDiff).toBeLessThan(60); // Should be within last minute
    console.log('✅ New timestamp is recent (', timeDiff, 'seconds ago)');
    
    console.log('✅ Stale session handling test completed successfully');
  });
});
