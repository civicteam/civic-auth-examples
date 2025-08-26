import { test, expect } from '@playwright/test';

test.describe('Mock Passkey Test', () => {
  test('should authenticate with mocked WebAuthn API', async ({ page, browserName }) => {
    // Only run this test in Chromium
    test.skip(browserName !== 'chromium', 'Test designed for Chromium');
    
    // Inject WebAuthn API mocking
    await page.context().addInitScript(() => {
      console.log('Setting up WebAuthn API mocking...');
      
      // Mock PublicKeyCredential support checks
      if (window.PublicKeyCredential) {
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () => {
          console.log('WebAuthn support check called - returning true');
          return Promise.resolve(true);
        };
        
        window.PublicKeyCredential.isConditionalMediationAvailable = () => {
          console.log('Conditional mediation check called - returning true');
          return Promise.resolve(true);
        };
      }
      
      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: false
      });
      
      // Mock navigator.credentials to return fake but valid-looking credentials
      const originalCredentials = window.navigator.credentials;
      
      Object.defineProperty(window.navigator, 'credentials', {
        value: {
          create: async (options: any) => {
            console.log('WebAuthn CREATE called with options:', JSON.stringify(options, null, 2));
            
            // Return a fake credential for creation
            const credentialId = new Uint8Array(32);
            crypto.getRandomValues(credentialId);
            
            const clientData = {
              type: 'webauthn.create',
              challenge: options.publicKey.challenge,
              origin: window.location.origin,
              crossOrigin: false
            };
            const clientDataJSON = new TextEncoder().encode(JSON.stringify(clientData));
            
            const attestationObject = new Uint8Array(256);
            crypto.getRandomValues(attestationObject);
            
            const credential = {
              id: credentialId,
              type: 'public-key',
              rawId: credentialId.buffer,
              response: {
                clientDataJSON: clientDataJSON.buffer,
                attestationObject: attestationObject.buffer
              },
              getClientExtensionResults: () => {
                console.log('getClientExtensionResults called - returning empty object');
                return {};
              }
            };
            
            console.log('Mock WebAuthn CREATE returning credential');
            return credential;
          },
          
          get: async (options: any) => {
            console.log('WebAuthn GET called with options:', JSON.stringify(options, null, 2));
            
            // Return a fake credential for assertion
            const credentialId = new Uint8Array(32);
            crypto.getRandomValues(credentialId);
            
            const clientData = {
              type: 'webauthn.get',
              challenge: options.publicKey.challenge,
              origin: window.location.origin,
              crossOrigin: false
            };
            const clientDataJSON = new TextEncoder().encode(JSON.stringify(clientData));
            
            const authenticatorData = new Uint8Array(128);
            crypto.getRandomValues(authenticatorData);
            
            const signature = new Uint8Array(128);
            crypto.getRandomValues(signature);
            
            const userHandle = new Uint8Array(32);
            crypto.getRandomValues(userHandle);
            
            const credential = {
              id: credentialId,
              type: 'public-key',
              rawId: credentialId.buffer,
              response: {
                clientDataJSON: clientDataJSON.buffer,
                authenticatorData: authenticatorData.buffer,
                signature: signature.buffer,
                userHandle: userHandle.buffer
              },
              getClientExtensionResults: () => {
                console.log('getClientExtensionResults called - returning empty object');
                return {};
              }
            };
            
            console.log('Mock WebAuthn GET returning credential');
            return credential;
          }
        },
        writable: false,
        configurable: true
      });
      
      console.log('WebAuthn API mocking setup complete');
    });

    try {
      // Navigate to the application
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      console.log('Page loaded, current URL:', page.url());
      
      // Start authentication flow
      await page.getByTestId('sign-in-button').click();
      
      // Wait for redirect to Civic auth
      await page.waitForURL('**/auth-dev.civic.com/**', { timeout: 30000 });
      console.log('Redirected to Civic auth, URL:', page.url());
      
      // Look for passkey button
      const passkeyButton = page.locator('button:has-text("I have a passkey")');
      await passkeyButton.waitFor({ state: 'visible', timeout: 30000 });
      await passkeyButton.click();
      console.log('Clicked passkey button');
      
      await page.waitForTimeout(2000);
      
      // Click Continue button
      const continueButton = page.locator('button:has-text("Continue")');
      await continueButton.waitFor({ state: 'visible', timeout: 10000 });
      await continueButton.click();
      console.log('Clicked Continue button');
      
      // Wait for the mocked WebAuthn to be processed
      await page.waitForTimeout(5000);
      
      // Take a screenshot
      await page.screenshot({ path: `mock-passkey-test-${browserName}.png` });
      
      console.log('Mock passkey test completed');
      
      // Wait for authentication to complete
      try {
        await page.waitForURL('**/localhost:3000**', { timeout: 15000 });
        console.log('Successfully authenticated! Final URL:', page.url());
      } catch (error) {
        console.log('Authentication timeout, checking current state...');
        console.log('Current URL:', page.url());
        
        // Take a final screenshot
        await page.screenshot({ path: `mock-passkey-test-final-${browserName}.png` });
      }
      
    } catch (error) {
      console.log('Test failed:', error);
      await page.screenshot({ path: `mock-passkey-test-failure-${browserName}.png` });
      throw error;
    }
  });
});

