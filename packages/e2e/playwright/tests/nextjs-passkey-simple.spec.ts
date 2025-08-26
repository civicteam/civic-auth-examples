import { test, expect } from '@playwright/test';

test.describe('Next.js Simple Passkey Test', () => {
  test('should authenticate with passkey using CDP virtual authenticator', async ({ page, browserName }) => {
    // Only run this test in Chromium (CDP is only available in Chromium)
    test.skip(browserName !== 'chromium', 'CDP virtual authenticator only works in Chromium');
    
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
      
      // Mock navigator.credentials if it doesn't exist
      if (!window.navigator.credentials) {
        (window.navigator as any).credentials = {
          create: async (options: any) => {
            console.log('navigator.credentials.create called');
            const credentialId = new Uint8Array(32);
            crypto.getRandomValues(credentialId);
            return {
              id: credentialId,
              type: 'public-key',
              rawId: credentialId.buffer,
              response: {
                clientDataJSON: new ArrayBuffer(64),
                attestationObject: new ArrayBuffer(128)
              }
            };
          },
          get: async (options: any) => {
            console.log('navigator.credentials.get called');
            const credentialId = new Uint8Array(32);
            crypto.getRandomValues(credentialId);
            return {
              id: credentialId,
              type: 'public-key',
              rawId: credentialId.buffer,
              response: {
                clientDataJSON: new ArrayBuffer(64),
                authenticatorData: new ArrayBuffer(64),
                signature: new ArrayBuffer(64),
                userHandle: new ArrayBuffer(32)
              }
            };
          }
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
    
    const result = await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'usb',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
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
    
    // Ensure user is verified
    await client.send('WebAuthn.setUserVerified', {
      authenticatorId: authenticatorId,
      isUserVerified: true,
    });
    
    console.log('Virtual authenticator ready for testing');
    
    // Now navigate to the page with WebAuthn support already injected
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click the sign in button
    await page.getByTestId('sign-in-button').click();
    
    // All browsers use redirect flow for passkey authentication
    await page.waitForURL('**/auth-dev.civic.com/**', { timeout: 30000 });
    
    // Click the Dummy button first
    const dummyButton = page.locator('button:has-text("I have a passkey")');
    await dummyButton.waitFor({ timeout: 30000 });
    await dummyButton.click();
    
    // Wait for the "Sign in with a passkey" screen to appear
    await page.waitForSelector('text=Sign in with a passkey', { timeout: 30000 });
    
    // Click the "Continue" button
    const continueButton = page.locator('button:has-text("Continue")');
    await continueButton.waitFor({ timeout: 10000 });
    await continueButton.click();
    
    // Wait for authentication to complete (the virtual authenticator should handle this automatically)
    await page.waitForTimeout(5000);
    
    // Take a screenshot to see what we have
    await page.screenshot({ path: `passkey-simple-test-${browserName}.png` });
    
    console.log('Current URL:', page.url());
    
    // Wait for successful authentication and redirect back to localhost
    await page.waitForURL('**/localhost:3000**', { timeout: 30000 });
    
    console.log('Successfully authenticated with passkey!');
    console.log('Final URL:', page.url());
    
    // Check what credentials were created
    const credentialsResult = await client.send('WebAuthn.getCredentials');
    console.log('Credentials in virtual authenticator:', credentialsResult.credentials?.length || 0);
  });
});
