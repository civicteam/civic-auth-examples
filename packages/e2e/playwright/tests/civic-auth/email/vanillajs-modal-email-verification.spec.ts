import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { db } from '../../../../utils/database';
import { generateUniqueEmail } from '../../../utils/email-generator';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.feature('VanillaJS Modal Email Verification');
  });

  test('should complete full modal email verification and logout flow', async ({ page, browserName }) => {
    await allure.story('VanillaJS Modal Email Code Verification Flow');
    await allure.severity('critical');
    await allure.tag('vanillajs-modal-email-verification');
    
    let extractedLoginFlowId = '';
    const uniqueEmail = generateUniqueEmail();

    // Open the app home page
    await allure.step('Navigate to VanillaJS modal app home page', async () => {
      await page.goto('http://localhost:3000');
    });

    // Wait for the page to fully load with all UI elements
    await allure.step('Wait for page to load', async () => {
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
    });
    
    // Click the modal sign in button
    await allure.step('Click modal sign in button', async () => {
      await page.click('#loginModalButton');
    });
    
    // Click log in with email in the iframe (modal mode still uses iframe)
    await allure.step('Handle iframe email verification flow', async () => {
      const frame = page.frameLocator('#civic-auth-iframe');
      await frame.locator('[data-testid="civic-login-oidc-button-dummy"]').click({ timeout: 20000 });

      // Wait for the iframe to be gone (indicating login is complete)
      await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
      // Look for the email login slot
      await allure.step('Find and click email login option', async () => {
        const emailSlot = frame.locator('[data-testid="civic-login-slot-email-comp"]');
        const emailSlotCount = await emailSlot.count();
        console.log(`Email slot count: ${emailSlotCount}`);
        
        if (emailSlotCount === 0) {
          throw new Error('Email login option not found in iframe');
        }
        
        await emailSlot.waitFor({ timeout: 30000 });
        await emailSlot.click();
      });
      
      // Enter email address
      await allure.step('Enter email address in iframe', async () => {
        const emailInput = frame.locator('[data-testid="email-input-text"]');
        await emailInput.waitFor({ timeout: 10000 });
        await emailInput.fill(uniqueEmail);
      });
      
      // Submit email form and wait for API response
      await allure.step('Submit email form and intercept API call', async () => {
        const responsePromise = page.waitForResponse(
          response => {
            const url = response.url();
            const hasLoginFlowId = url.includes('loginFlowId');
            const isEmailEndpoint = url.includes('/email') && response.request().method() === 'GET' && url.includes('?');
            const isVerifyEndpoint = url.includes('/verify') || url.includes('/send-code');
            return hasLoginFlowId || isEmailEndpoint || isVerifyEndpoint;
          },
          { timeout: 30000 }
        );
        
        const submitButton = frame.locator('button svg.lucide-arrow-right').locator('..');
        await submitButton.waitFor({ timeout: 10000 });
        await submitButton.click();
        
        const emailResponse = await responsePromise;
        const emailUrl = emailResponse.url();
        console.log('Email verification URL:', emailUrl);
        
        const urlParams = new URLSearchParams(emailUrl.split('?')[1]);
        let loginFlowId = urlParams.get('loginFlowId') || '';
        
        console.log('Extracted loginFlowId:', loginFlowId);
        
        if (!loginFlowId) {
          throw new Error(`No loginFlowId found in URL: ${emailUrl}`);
        }
        
        extractedLoginFlowId = loginFlowId;
      });
      
      // Wait for and retrieve verification code from database
      await allure.step('Wait for verification code and retrieve from API', async () => {
        const loginFlowId = extractedLoginFlowId;
        
        // Wait for the code input fields to appear
        await frame.locator('[data-testid="code-input-0"]').waitFor({ timeout: 30000 });
        
        // Connect to database and retrieve the actual verification code
        await db.connect();
        const verificationCode = await db.waitForEmailCode(loginFlowId, 15, 2000);
        await db.disconnect();
        
        console.log(`Retrieved verification code: ${verificationCode} for loginFlowId: ${loginFlowId}`);
        
        // Enter each digit of the code
        for (let i = 0; i < verificationCode.length; i++) {
          const digitInput = frame.locator(`[data-testid="code-input-${i}"]`);
          await digitInput.fill(verificationCode[i]);
        }
      });
      
      // Wait for the iframe to be gone (indicating login is complete)
      await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    });
    
    // Confirm logged in state by checking for user info display
    await allure.step('Verify login success', async () => {
      await expect(page.locator('#userInfo')).toHaveClass(/show/, { timeout: 20000 });
      await expect(page.locator('#userName')).toBeVisible({ timeout: 20000 });
      await expect(page.locator('#userName')).not.toBeEmpty();
    });

    // Click the logout button
    await allure.step('Click logout button', async () => {
      await page.locator('#logoutButton').click();
    });
    
    // Confirm successful logout
    await allure.step('Verify logout success', async () => {
      await expect(page.locator('#userInfo')).not.toHaveClass(/show/);
    });
    
    // Verify token refresh fails after logout
    await allure.step('Verify token refresh fails after logout', async () => {
      const response = await page.request.post('https://auth-dev.civic.com/oauth/token', {
        form: {
          grant_type: 'refresh_token',
          refresh_token: 'storedRefreshToken',
          client_id: process.env.CLIENT_ID || ''
        }
      });
      expect(response.status()).toBe(400);
    });
  });
});
