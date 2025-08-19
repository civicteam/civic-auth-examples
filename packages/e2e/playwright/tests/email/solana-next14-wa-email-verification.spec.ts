import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { db } from '../../../utils/database';

test.describe('Solana Next.js 14 Wallet Adapter Email Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Sample Applications');
    await allure.feature('Solana Next.js 14 Wallet Adapter Email Verification');
  });

  test('should complete email verification flow with wallet adapter', async ({ page, browserName }) => {
    await allure.story('Solana Next.js 14 Wallet Adapter Email Code Verification Flow');
    await allure.severity('critical');
    await allure.tag('solana-nextjs14-wa-email-verification');
    
    let extractedLoginFlowId = '';

    // Open the app home page
    await allure.step('Navigate to Solana Next.js 14 app home page', async () => {
      await page.goto('http://localhost:3000');
    });
    
    // Click the select wallet button
    await allure.step('Click select wallet button', async () => {
      await page.click('.wallet-adapter-button-trigger');
    });
    
    // Click the civic wallet button
    await allure.step('Click Civic wallet button', async () => {
      await page.click('button:has-text("Login via Civic")');
    });
    
    if (browserName === 'webkit') {
      await allure.step('Handle WebKit redirect email verification flow', async () => {
        // WebKit uses redirect flow instead of iframe
        // Wait for navigation to the auth server
        await page.waitForURL('**/auth-dev.civic.com/**', { timeout: 30000 });
        
        // Click "Log in with email" button
        const emailButton = page.locator('[data-testid="civic-login-slot-email-comp"]');
        await emailButton.waitFor({ timeout: 30000 });
        await emailButton.click();
        
        // Enter email address
        await allure.step('Enter email address', async () => {
          const emailInput = page.locator('[data-testid="email-input-text"]');
          await emailInput.waitFor({ timeout: 10000 });
          await emailInput.fill('success@simulator.amazonses.com');
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
      });
    } else {
      await allure.step('Handle iframe email verification flow', async () => {
        // Chrome/Firefox use iframe flow
        // Wait for iframe to appear and load
        await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
        
        // Click log in with email in the iframe
        const frame = page.frameLocator('#civic-auth-iframe');
        
        // Wait for the frame to load completely first
        await frame.locator('body').waitFor({ timeout: 30000 });
        
        // Wait for the login UI to fully load
        await allure.step('Wait for login UI to load', async () => {
          await frame.locator('#civic-login-app-loading').waitFor({ state: 'hidden', timeout: 30000 });
          await frame.locator('[data-testid*="civic-login"]').first().waitFor({ timeout: 30000 });
        });
        
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
          await emailInput.fill('success@simulator.amazonses.com');
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
    }
    
    // Verify wallet adapter shows connected state
    await allure.step('Verify wallet adapter connected state', async () => {
      await expect(page.locator('.wallet-adapter-button.wallet-adapter-button-trigger')).toBeVisible({ timeout: 60000 });
      await expect(page.locator('.wallet-adapter-button-start-icon')).toBeVisible({ timeout: 20000 });
      await expect(page.locator('.wallet-adapter-button-trigger')).toContainText(/^[A-Za-z0-9]{4}\.\.([A-Za-z0-9]{4})$/, { timeout: 20000 });
    });
    
    // Verify wallet address and balance are displayed
    await allure.step('Verify wallet address and balance', async () => {
      await expect(page.locator('text=/Wallet address: [A-Za-z0-9]{32,44}/')).toBeVisible({ timeout: 20000 });
      await expect(page.locator('text=Balance: 0 SOL')).toBeVisible({ timeout: 20000 });
    });
    
    // Test logout functionality
    await allure.step('Test logout functionality', async () => {
      // Click the wallet adapter button to open the dropdown
      await page.click('.wallet-adapter-button-trigger');
      
      // Wait for the dropdown to be visible and click the Disconnect option
      const disconnectButton = page.locator('.wallet-adapter-dropdown-list-active li:has-text("Disconnect")');
      await expect(disconnectButton).toBeVisible({ timeout: 10000 });
      await disconnectButton.click();
      
      // Verify wallet adapter button is back to disconnected state
      await expect(page.locator('text=User not logged in')).toBeVisible({ timeout: 10000 });
    });
  });
});
