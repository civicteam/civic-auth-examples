import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { db } from '../../../../utils/database';
import { generateUniqueEmail } from '../../../utils/email-generator';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('Email');
    await allure.feature('Wagmi Email Verification');
  });

  test('should complete email verification flow', async ({ page, browserName }) => {
    await allure.story('Wagmi Email Code Verification Flow');
    await allure.severity('critical');
    await allure.tag('wagmi-email-verification');
    
    let extractedLoginFlowId = '';
    const uniqueEmail = generateUniqueEmail();

    // Open the app home page
    await allure.step('Navigate to Wagmi app home page', async () => {
      await page.goto('http://localhost:3000');
    });

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the sign in button to be visible and enabled/clickable
    await allure.step('Click sign in button', async () => {
      const signInButton = page.getByTestId('sign-in-button');
      await signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await expect(signInButton).toBeEnabled({ timeout: 10000 });
      
      // Add a small delay to ensure the button is fully interactive
      await page.waitForTimeout(1000);
      await signInButton.click();
    });
    
    await allure.step('Handle iframe email verification flow', async () => {
      // Chrome/Firefox use iframe flow
      // Wait for iframe to be present in DOM (don't care if it's visible or hidden)
      await page.waitForSelector('#civic-auth-iframe', { state: 'attached', timeout: 30000 });
      
      // Click log in with email in the iframe
      const frame = page.frameLocator('#civic-auth-iframe');
      
      // Try to wait for the frame to load completely first
      await frame.locator('body').waitFor({ timeout: 30000 });
      
      // Wait for the login UI to fully load (not just the loading spinner)
      await allure.step('Wait for login UI to load', async () => {
        try {
          const loadingElement = frame.locator('#civic-login-app-loading');
          const isLoadingVisible = await loadingElement.isVisible({ timeout: 5000 }).catch(() => false);
          
          if (isLoadingVisible) {
            await loadingElement.waitFor({ state: 'hidden', timeout: 45000 });
          }
        } catch (error) {
          // Loading element might not exist, that's ok
        }
        
        // Wait for login elements to appear
        await frame.locator('[data-testid*="civic-login"]').first().waitFor({ timeout: 30000 });
      });
      
      // Look for the email login slot - first check if it's visible
      await allure.step('Find and click email login option', async () => {
        // Try to find the email slot component
        const emailSlot = frame.locator('[data-testid="civic-login-slot-email-comp"]');
        
        // Check if email slot exists and is visible
        const emailSlotCount = await emailSlot.count();
        console.log(`Email slot count: ${emailSlotCount}`);
        
        if (emailSlotCount === 0) {
          // Email slot not found, might need to look for email input directly
          console.log('Email slot not found, looking for email input...');
          const emailInputs = frame.locator('input[type="email"], [data-testid*="email"]');
          const inputCount = await emailInputs.count();
          console.log(`Found ${inputCount} email-related inputs`);
          
          // Log all inputs to see what's available
          const allInputs = frame.locator('input');
          const allInputCount = await allInputs.count();
          console.log(`Found ${allInputCount} total inputs`);
          
          for (let i = 0; i < Math.min(allInputCount, 5); i++) {
            const input = allInputs.nth(i);
            const type = await input.getAttribute('type');
            const testId = await input.getAttribute('data-testid');
            const placeholder = await input.getAttribute('placeholder');
            console.log(`Input ${i}: type="${type}", data-testid="${testId}", placeholder="${placeholder}"`);
          }
          
          throw new Error('Email login option not found in iframe');
        }
        
        await emailSlot.waitFor({ timeout: 30000 });
        // Add a small delay to ensure button is fully interactive
        await page.waitForTimeout(1000);
        await emailSlot.click();
      });
      
      // Enter email address
      await allure.step('Enter email address in iframe', async () => {
        const emailInput = frame.locator('[data-testid="email-input-text"]');
        await emailInput.waitFor({ timeout: 10000 });
        await emailInput.fill(uniqueEmail);
      });
      
      // Submit email form and wait for API response - use exact selector from Cypress
      await allure.step('Submit email form and intercept API call', async () => {
        // Set up the network interception BEFORE clicking submit
        const responsePromise = page.waitForResponse(
          response => {
            const url = response.url();
            const hasLoginFlowId = url.includes('loginFlowId');
            const isEmailEndpoint = url.includes('/email') && response.request().method() === 'GET' && url.includes('?');
            const isVerifyEndpoint = url.includes('/verify') || url.includes('/send-code');
            console.log(`Checking URL: ${url}, hasLoginFlowId: ${hasLoginFlowId}, isEmailEndpoint: ${isEmailEndpoint}, isVerifyEndpoint: ${isVerifyEndpoint}`);
            return hasLoginFlowId || isEmailEndpoint || isVerifyEndpoint;
          },
          { timeout: 30000 }
        );
        
        const submitButton = frame.locator('button svg.lucide-arrow-right').locator('..');
        await submitButton.waitFor({ timeout: 10000 });
        // Add a small delay to ensure button is fully interactive
        await page.waitForTimeout(1000);
        await submitButton.click();
        
        // Now wait for the response
        const emailResponse = await responsePromise;
        const emailUrl = emailResponse.url();
        console.log('Email verification URL:', emailUrl);
        
        const urlParams = new URLSearchParams(emailUrl.split('?')[1]);
        let loginFlowId = urlParams.get('loginFlowId') || '';
        
        console.log('Extracted loginFlowId:', loginFlowId);
        
        if (!loginFlowId) {
          throw new Error(`No loginFlowId found in URL: ${emailUrl}`);
        }
        
        // Store loginFlowId for use in the next step
        extractedLoginFlowId = loginFlowId;
      });
      
      // Wait for and retrieve verification code from database
      await allure.step('Wait for verification code and retrieve from API', async () => {
        const loginFlowId = extractedLoginFlowId;
        
        // Wait for the code input fields to appear
        await frame.locator('[data-testid="code-input-0"]').waitFor({ timeout: 30000 });
        
        // Connect to database and retrieve the actual verification code
        await db.connect();
        const verificationCode = await db.waitForEmailCode(loginFlowId, 15, 2000); // Wait up to 30 seconds
        await db.disconnect();
        
        console.log(`Retrieved verification code: ${verificationCode} for loginFlowId: ${loginFlowId}`);
        
        // Enter each digit of the code (Cypress does this digit by digit)
        for (let i = 0; i < verificationCode.length; i++) {
          const digitInput = frame.locator(`[data-testid="code-input-${i}"]`);
          await digitInput.fill(verificationCode[i]);
        }
      });
      
      // Note: Verification automatically submits when 6th digit is entered

      // Wait for the iframe to be gone (indicating login is complete)
      await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    });

    // Confirm logged in state by checking for email in dropdown
    await allure.step('Verify login success with email', async () => {
      await expect(page.locator('#civic-dropdown-container').locator(`button:has-text("${uniqueEmail}")`)).toBeVisible({ timeout: 20000 });
      
      // Verify custom loginSuccessUrl is not loaded
      await expect(page.url()).not.toContain('loginSuccessUrl');
    });
    
    // Verify wallet address is displayed (Web3 functionality)
    await allure.step('Verify wallet address', async () => {
      await expect(page.locator('text=/Wallet address: [A-Za-z0-9]{32,44}/')).toBeVisible({ timeout: 20000 });
    });
    
    // Test logout functionality
    await allure.step('Test logout functionality', async () => {
      // Click the email dropdown to open it (be more specific to avoid strict mode violation)
      const emailDropdownButton = page.locator('#civic-dropdown-container').locator(`button:has-text("${uniqueEmail}")`);
      await emailDropdownButton.click();
      
      // Click the logout button (using same selector as nextjs-login.spec.ts)
      const logoutButton = page.locator('#civic-dropdown-container').locator('button:has-text("Log out")');
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();
      
      // Verify sign in button is visible again
      await expect(page.getByTestId('sign-in-button')).toBeVisible({ timeout: 10000 });
    });
  });
});
