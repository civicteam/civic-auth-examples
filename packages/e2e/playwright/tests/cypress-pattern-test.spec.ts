import { test, expect } from '@playwright/test';
import { WebAuthnHelper } from '../../utils/webauthn-helper';

test.describe('Passkey Test using Oursky Pattern', () => {
  test('should authenticate with passkey using virtual authenticator', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Test designed for Chromium');
    
    // Create and setup the virtual passkey device
    const webAuthnHelper = new WebAuthnHelper(page, context);
    await webAuthnHelper.setupWebAuthnEnvironment();
    
    try {
      // Navigate to application and start login
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Click the sign in button
      await page.getByTestId('sign-in-button').click();
      
      // Wait for redirect to Civic auth
      await page.waitForURL('**/auth-dev.civic.com/**', { timeout: 30000 });
      
      // Click the passkey button
      await page.locator('button:has-text("I have a passkey")').click();
      await page.waitForSelector('text=Sign in with a passkey', { timeout: 30000 });
      
      // Set user as verified before clicking Continue
      await webAuthnHelper.setUserVerified(true);
      
      // Click Continue
      await page.locator('button:has-text("Continue")').click();
      
      // Wait for authentication to complete
      await page.waitForURL('**/localhost:3000**', { timeout: 30000 });
      
      console.log('Successfully authenticated with passkey!');
      console.log('Final URL:', page.url());
      
    } catch (error) {
      console.log('Test failed:', error);
      await page.screenshot({ path: `passkey-test-failure-${browserName}.png` });
      throw error;
    } finally {
      // Clean up by removing the virtual authenticator
      await webAuthnHelper.removeAuthenticator();
    }
  });
});
