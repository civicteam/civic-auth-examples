import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { setupDiagnostics } from '../../../utils/test-helpers';
import { db } from '../../../../utils/database';
import { generateUniqueEmail } from '../../../utils/email-generator';

test.describe('Civic Auth Applications', () => {
  test.beforeEach(async ({ page }) => {
    setupDiagnostics(page);
    await allure.epic('Civic Auth Applications');
    await allure.suite('Email');
    await allure.feature('VanillaJS Embedded Email Verification');
  });

  test('should complete full embedded email verification and logout flow', async ({ page, browserName }) => {
    setupDiagnostics(page);
    let extractedLoginFlowId = '';
    const uniqueEmail = generateUniqueEmail();

    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click the embedded start auth button
    await page.click('#startAuthButton');
    
    // Wait for the embedded page to load
    await page.waitForLoadState('networkidle');
    
    // Chrome/Firefox use iframe flow
    // Wait for iframe to appear and load inside the iframeContainer
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { timeout: 30000 });
    
    // Click log in with email in the iframe
    const frame = page.frameLocator('#iframeContainer #civic-auth-iframe');
      
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Wait for the login UI to fully load (not just the loading spinner)
    // Wait for the login content to appear (no more loading)
    await frame.locator('#civic-login-app-loading').waitFor({ state: 'hidden', timeout: 30000 });
    
    // Alternative: wait for any actual login elements to appear
    await frame.locator('[data-testid*="civic-login"]').first().waitFor({ timeout: 30000 });
    
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
    await emailSlot.click();
    
    // Enter email address
    const emailInput = frame.locator('[data-testid="email-input-text"]');
    await emailInput.waitFor({ timeout: 10000 });
    await emailInput.fill(uniqueEmail);
    
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
    await submitButton.click();
    
    // Now wait for the response
    const emailResponse = await responsePromise;
    const emailUrl = emailResponse.url();
    console.log('Email verification URL:', emailUrl);
    
    const urlParams = new URLSearchParams(emailUrl.split('?')[1]);
    const loginFlowId = urlParams.get('loginFlowId') || '';
    
    console.log('Extracted loginFlowId:', loginFlowId);
    
    if (!loginFlowId) {
      throw new Error(`No loginFlowId found in URL: ${emailUrl}`);
    }
    
    // Store loginFlowId for use in the next step
    extractedLoginFlowId = loginFlowId;
    
    // Wait for and retrieve verification code from database
    
    // Wait for the code input fields to appear
    await frame.locator('[data-testid="code-input-0"]').waitFor({ timeout: 30000 });
    
    // Connect to database and retrieve the actual verification code
    await db.connect();
    const verificationCode = await db.waitForEmailCode(extractedLoginFlowId, 15, 2000); // Wait up to 30 seconds
    await db.disconnect();
    
    console.log(`Retrieved verification code: ${verificationCode} for loginFlowId: ${extractedLoginFlowId}`);
    
    // Enter each digit of the code (Cypress does this digit by digit)
    for (let i = 0; i < verificationCode.length; i++) {
      const digitInput = frame.locator(`[data-testid="code-input-${i}"]`);
      await digitInput.fill(verificationCode[i]);
    }
    
    // Note: Verification automatically submits when 6th digit is entered

    // Wait for the iframe to be gone (indicating login is complete)
    await page.waitForSelector('#iframeContainer #civic-auth-iframe', { state: 'hidden', timeout: 60000 });

    // Check that we're logged in by verifying the embedded status shows success
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toContainText('@simulator.amazonses.com');
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toHaveClass(/success/);
    
    // Now logout using the "Logout All" button
    await page.click('[data-testid="vanilla-js-logout-button"]');
    
    // Verify we're logged out by checking the embedded status returns to "Ready"
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toContainText('Ready');
    await expect(page.locator('[data-testid="vanilla-js-embedded-status"]')).toHaveClass(/ready/);
    
    // Verify token refresh fails after logout
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
