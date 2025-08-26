import { test, expect } from '@playwright/test';

test.describe('Corbado Passkey Test', () => {
  test('should authenticate with passkey using WebAuthn virtual authenticator', async ({ page, browserName }) => {
    // Only run this test in Chromium
    test.skip(browserName !== 'chromium', 'Test designed for Chromium');
    
    // Inject WebAuthn support BEFORE navigating to any page
    await page.context().addInitScript(() => {
      console.log('Injecting WebAuthn support checks...');
      
      // Override WebAuthn support checks to always return true
      if (window.PublicKeyCredential) {
        // Override existing methods
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () => {
          console.log('WebAuthn support check called - returning true');
          return Promise.resolve(true);
        };
        
        window.PublicKeyCredential.isConditionalMediationAvailable = () => {
          console.log('Conditional mediation check called - returning true');
          return Promise.resolve(true);
        };
        
        if (!(window.PublicKeyCredential as any).isExternalCTAP2SecurityKeySupported) {
          (window.PublicKeyCredential as any).isExternalCTAP2SecurityKeySupported = () => {
            console.log('External CTAP2 security key check called - returning true');
            return Promise.resolve(true);
          };
        }
      } else {
        // Create PublicKeyCredential if it doesn't exist
        (window as any).PublicKeyCredential = {
          isUserVerifyingPlatformAuthenticatorAvailable: () => Promise.resolve(true),
          isConditionalMediationAvailable: () => Promise.resolve(true),
          isExternalCTAP2SecurityKeySupported: () => Promise.resolve(true)
        };
      }
      
      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: false
      });
      
      console.log('WebAuthn support injection complete');
    });
    
    // Now set up the CDP virtual authenticator
    const client = await page.context().newCDPSession(page);
    await client.send('WebAuthn.enable');
    
    // Add virtual authenticator with correct Playwright CDP syntax
    const result = await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'usb',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true
      }
    });
    
    const authenticatorId = result.authenticatorId;
    console.log('WebAuthn virtual authenticator set up successfully with ID:', authenticatorId);
    
    // Set up event listeners
    client.on('WebAuthn.credentialAdded', (event: any) => {
      console.log('Credential added:', event);
    });
    
    client.on('WebAuthn.credentialAsserted', (event: any) => {
      console.log('Credential asserted:', event);
    });
    
    // Add more event listeners to track authenticator selection
    (client as any).on('WebAuthn.authenticatorSelected', (event: any) => {
      console.log('🔍 Authenticator selected:', event);
    });
    
    (client as any).on('WebAuthn.authenticatorDeselected', (event: any) => {
      console.log('🔍 Authenticator deselected:', event);
    });
    
    // Ensure user is verified
    await client.send('WebAuthn.setUserVerified', {
      authenticatorId: authenticatorId,
      isUserVerified: true,
    });
    
    // Set automatic presence simulation to make authenticator more responsive
    await client.send('WebAuthn.setAutomaticPresenceSimulation', {
      authenticatorId: authenticatorId,
      enabled: true
    });
    
    console.log('Virtual authenticator ready for testing');
    
    // Check initial state
    try {
      const initialCredentials = await client.send('WebAuthn.getCredentials', {
        authenticatorId: authenticatorId
      });
      console.log('🔍 Initial credentials in authenticator:', initialCredentials.credentials?.length || 0);
    } catch (error) {
      console.log('❌ Error getting initial credentials:', error);
    }

    try {
      // Navigate to the page with WebAuthn support already injected
      await page.goto('http://localhost:3000');
      
      // Wait for the page to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      
      console.log('Page loaded, current URL:', page.url());
      
      // Click the sign in button
      await page.getByTestId('sign-in-button').click();
      
      // All browsers use redirect flow for passkey authentication
      await page.waitForURL('**/auth-dev.civic.com/**', { timeout: 30000 });
      console.log('Redirected to Civic auth, URL:', page.url());
      
      // Click the passkey button first
      const passkeyButton = page.locator('button:has-text("I have a passkey")');
      await passkeyButton.waitFor({ timeout: 30000 });
      await passkeyButton.click();
      console.log('Clicked passkey button');
      
      // Wait for the "Sign in with a passkey" screen to appear
      await page.waitForSelector('text=Sign in with a passkey', { timeout: 30000 });
      
      // Click the "Continue" button
      const continueButton = page.locator('button:has-text("Continue")');
      await continueButton.waitFor({ timeout: 10000 });
      await continueButton.click();
      console.log('Clicked Continue button');
      
      // Wait for authentication to complete (the virtual authenticator should handle this automatically)
      await page.waitForTimeout(5000);
      
      // Check if authenticator was used
      try {
        const finalCredentials = await client.send('WebAuthn.getCredentials', {
          authenticatorId: authenticatorId
        });
        console.log('🔍 Final credentials in authenticator:', finalCredentials.credentials?.length || 0);
        
        if (finalCredentials.credentials && finalCredentials.credentials.length > 0) {
          console.log('✅ Virtual authenticator was used! Credentials found:', finalCredentials.credentials);
        } else {
          console.log('❌ Virtual authenticator was NOT used. No credentials found.');
        }
      } catch (error) {
        console.log('❌ Error getting final credentials:', error);
      }
      
      // Take a screenshot to see what we have
      await page.screenshot({ path: `corbado-passkey-test-${browserName}.png` });
      
      console.log('Current URL:', page.url());
      
      // Wait for successful authentication and redirect back to localhost
      await page.waitForURL('**/localhost:3000**', { timeout: 30000 });
      
      console.log('Successfully authenticated with passkey!');
      console.log('Final URL:', page.url());
      
      // Check what credentials were created
      const credentialsResult = await client.send('WebAuthn.getCredentials');
      console.log('Credentials in virtual authenticator:', credentialsResult.credentials?.length || 0);
      
    } catch (error) {
      console.log('Test failed:', error);
      await page.screenshot({ path: `corbado-passkey-test-failure-${browserName}.png` });
      throw error;
    } finally {
      // Clean up
      try {
        await client.send('WebAuthn.removeVirtualAuthenticator', {
          authenticatorId: authenticatorId
        });
        console.log('Virtual authenticator cleaned up');
      } catch (error) {
        console.log('Error cleaning up authenticator:', error);
      }
    }
  });
});
