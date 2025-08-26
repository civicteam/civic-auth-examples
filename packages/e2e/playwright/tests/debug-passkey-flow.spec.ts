import { test, expect } from '@playwright/test';

test.describe('Debug Passkey Flow', () => {
  test('should debug the passkey authentication flow', async ({ page, browserName }) => {
    // Only run this test in Chromium
    test.skip(browserName !== 'chromium', 'Test designed for Chromium');
    
    // Set up CDP session
    const client = await page.context().newCDPSession(page);
    await client.send('WebAuthn.enable');
    
    // Add a virtual authenticator
    const result = await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        defaultBackupEligibility: false,
        defaultBackupState: false
      }
    });
    
    const authenticatorId = result.authenticatorId;
    console.log('🔧 Virtual authenticator created with ID:', authenticatorId);
    
    // Set user verification to true
    await client.send('WebAuthn.setUserVerified', {
      authenticatorId: authenticatorId,
      isUserVerified: true
    });
    
    // Set automatic presence simulation
    await client.send('WebAuthn.setAutomaticPresenceSimulation', {
      authenticatorId: authenticatorId,
      enabled: true
    });
    
    // Inject WebAuthn support
    await page.addInitScript(() => {
      console.log('🔧 Setting up WebAuthn support...');
      
      // Mock PublicKeyCredential support checks
      if (window.PublicKeyCredential) {
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () => {
          console.log('✅ Platform authenticator check - returning true');
          return Promise.resolve(true);
        };
        
        window.PublicKeyCredential.isConditionalMediationAvailable = () => {
          console.log('✅ Conditional mediation check - returning true');
          return Promise.resolve(true);
        };
      }
      
      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: false,
        configurable: true
      });
      
      console.log('✅ WebAuthn support setup complete');
    });

    try {
      // Navigate to the application
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      console.log('Page loaded, current URL:', page.url());
      
      // Take a screenshot of the initial page
      await page.screenshot({ path: `debug-initial-${browserName}.png` });
      
      // Start authentication flow
      await page.getByTestId('sign-in-button').click();
      
      // Wait for redirect to Civic auth
      await page.waitForURL('**/auth-dev.civic.com/**', { timeout: 30000 });
      console.log('Redirected to Civic auth, URL:', page.url());
      
      // Take a screenshot of the Civic auth page
      await page.screenshot({ path: `debug-civic-auth-${browserName}.png` });
      
      // Debug: Log all buttons on the page
      const allButtons = await page.locator('button').all();
      console.log('🔍 All buttons found:', allButtons.length);
      
      for (let i = 0; i < allButtons.length; i++) {
        try {
          const text = await allButtons[i].textContent();
          const isVisible = await allButtons[i].isVisible();
          console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
        } catch (error) {
          console.log(`Button ${i}: Error getting text - ${error}`);
        }
      }
      
      // Look for passkey-related buttons
      const passkeyButtons = await page.locator('button:has-text("passkey")').all();
      console.log('🔍 Passkey buttons found:', passkeyButtons.length);
      
      const createButtons = await page.locator('button:has-text("Create")').all();
      console.log('🔍 Create buttons found:', createButtons.length);
      
      const continueButtons = await page.locator('button:has-text("Continue")').all();
      console.log('🔍 Continue buttons found:', continueButtons.length);
      
      // Try to find any button that might be the passkey button
      const possiblePasskeySelectors = [
        'button:has-text("I have a passkey")',
        'button:has-text("passkey")',
        'button:has-text("Passkey")',
        'button:has-text("Sign in with passkey")',
        'button:has-text("Use passkey")',
        '[data-testid*="passkey"]',
        '[aria-label*="passkey"]'
      ];
      
      for (const selector of possiblePasskeySelectors) {
        try {
          const button = page.locator(selector);
          const count = await button.count();
          if (count > 0) {
            console.log(`✅ Found button with selector: ${selector} (count: ${count})`);
            const isVisible = await button.first().isVisible();
            console.log(`   Visible: ${isVisible}`);
            if (isVisible) {
              console.log(`   Clicking: ${selector}`);
              await button.first().click();
              break;
            }
          }
        } catch (error) {
          console.log(`❌ Error with selector ${selector}: ${error}`);
        }
      }
      
      // Wait a bit and take another screenshot
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `debug-after-passkey-click-${browserName}.png` });
      
      // Debug: Log all buttons again after clicking
      const allButtonsAfter = await page.locator('button').all();
      console.log('🔍 All buttons after passkey click:', allButtonsAfter.length);
      
      for (let i = 0; i < allButtonsAfter.length; i++) {
        try {
          const text = await allButtonsAfter[i].textContent();
          const isVisible = await allButtonsAfter[i].isVisible();
          console.log(`Button ${i} after: "${text}" (visible: ${isVisible})`);
        } catch (error) {
          console.log(`Button ${i} after: Error getting text - ${error}`);
        }
      }
      
      // Look for Create or Continue buttons
      const createButtonsAfter = await page.locator('button:has-text("Create")').all();
      console.log('🔍 Create buttons after passkey click:', createButtonsAfter.length);
      
      const continueButtonsAfter = await page.locator('button:has-text("Continue")').all();
      console.log('🔍 Continue buttons after passkey click:', continueButtonsAfter.length);
      
      // Try to click Create or Continue if found
      if (createButtonsAfter.length > 0) {
        const createButton = createButtonsAfter[0];
        if (await createButton.isVisible()) {
          console.log('✅ Clicking Create button');
          await createButton.click();
        }
      } else if (continueButtonsAfter.length > 0) {
        const continueButton = continueButtonsAfter[0];
        if (await continueButton.isVisible()) {
          console.log('✅ Clicking Continue button');
          await continueButton.click();
        }
      }
      
      // Wait for any WebAuthn activity
      await page.waitForTimeout(5000);
      
      // Take final screenshot
      await page.screenshot({ path: `debug-final-${browserName}.png` });
      
      console.log('Debug test completed');
      
    } catch (error) {
      console.log('Test failed:', error);
      await page.screenshot({ path: `debug-failure-${browserName}.png` });
      throw error;
    } finally {
      // Clean up
      try {
        await client.send('WebAuthn.removeVirtualAuthenticator', {
          authenticatorId: authenticatorId
        });
        console.log('🔧 Virtual authenticator cleaned up');
      } catch (error) {
        console.log('❌ Error cleaning up authenticator:', error);
      }
    }
  });
});

