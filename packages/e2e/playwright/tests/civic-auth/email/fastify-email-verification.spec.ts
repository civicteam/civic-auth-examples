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
    await allure.feature('Fastify Email Verification');
  });

  test('should complete email verification flow with actual email', async ({ page, browserName }) => {
    setupDiagnostics(page);
    await allure.story('Fastify Email Code Verification Flow with Real Email');
    await allure.severity('critical');
    await allure.tag('fastify-email-verification-real');
    
    let extractedLoginFlowId = '';
    const uniqueEmail = generateUniqueEmail();

    // Go to the app home page
    await allure.step('Navigate to Fastify app home page', async () => {
      await page.goto('http://localhost:3000');
    });

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
        
    // Click "Log in with email" button
    await allure.step('Click email login option', async () => {
      const emailButton = page.locator('[data-testid="civic-login-slot-email-comp"]');
      await emailButton.waitFor({ timeout: 30000 });
      await emailButton.click();
    });

    // Enter email address
    await allure.step('Enter email address', async () => {
      const emailInput = page.locator('[data-testid="email-input-text"]');
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

      const submitButton = page.locator('button svg.lucide-arrow-right').locator('..');
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
      await page.locator('[data-testid="code-input-0"]').waitFor({ timeout: 30000 });

      // Connect to database and retrieve the actual verification code
      await db.connect();
      const verificationCode = await db.waitForEmailCode(loginFlowId, 15, 2000);
      await db.disconnect();

      console.log(`Retrieved verification code: ${verificationCode} for loginFlowId: ${loginFlowId}`);

      // Enter each digit of the code
      for (let i = 0; i < verificationCode.length; i++) {
        const digitInput = page.locator(`[data-testid="code-input-${i}"]`);
        await digitInput.fill(verificationCode[i]);
      }
    });

    // Wait for redirect to callback and then to hello page
    await allure.step('Wait for redirect to hello page', async () => {
      await expect(page).toHaveURL(/.*\/admin\/hello/, { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Hello');
    });
  });
});
