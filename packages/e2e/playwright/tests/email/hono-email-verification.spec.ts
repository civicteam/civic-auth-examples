import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { db } from '../../../utils/database';

test.describe('Hono Email Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Sample Applications');
    await allure.feature('Hono Email Verification');
  });

  test('should complete email verification flow and redirect to hello page', async ({ page, browserName }) => {
    await allure.story('Hono Email Code Verification Flow');
    await allure.severity('critical');
    await allure.tag('hono-email-verification');
    
    let extractedLoginFlowId = '';

    // Intercept the external Civic auth server and redirect back to your app
    await allure.step('Set up auth server interception', async () => {
      await page.route('**auth-dev.civic.com/**', async (route) => {
        const url = new URL(route.request().url());
        const redirectUri = url.searchParams.get('redirect_uri') || 'http://localhost:3000/auth/callback';
        await route.fulfill({
          status: 302,
          headers: {
            'location': `${redirectUri}?code=mock-code&state=mock-state`,
            'content-length': '0',
            'date': new Date().toUTCString()
          },
          body: ''
        });
      });
    });

    // Intercept your app's callback and set the cookie, then redirect to /admin/hello
    await allure.step('Set up callback interception', async () => {
      await page.route('**/auth/callback*', async (route) => {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const expiresInSeconds = nowInSeconds + 60;
        const expires = new Date(expiresInSeconds * 1000).toUTCString();

        const mockJwt = {
          alg: 'RS256',
          typ: 'JWT',
          kid: 'civic-auth-token-signer-key'
        };

        const mockPayload = {
          sub: 'test-user',
          exp: expiresInSeconds,
          iat: nowInSeconds
        };

        const mockToken = `${Buffer.from(JSON.stringify(mockJwt)).toString('base64')}.${Buffer.from(JSON.stringify(mockPayload)).toString('base64')}.mocksignature`;

        // Fulfill with a script that sets the cookie and redirects
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <script>
              document.cookie = "id_token=${mockToken}; Path=/; Expires=${expires}; SameSite=Lax";
              window.location.href = '/admin/hello';
            </script>
          `
        });
      });
    });

    // Go to the app home page
    await allure.step('Navigate to Hono app home page', async () => {
      await page.goto('http://localhost:3000');
    });

    // Click log in button
    await allure.step('Click login button', async () => {
      await page.locator('[data-testid="civic-login-oidc-button-dummy"]').click({ timeout: 20000 });
    });

    // Now you can immediately check the URL and page content
    await allure.step('Verify redirect to hello page', async () => {
      await expect(page).toHaveURL(/.*\/admin\/hello/, { timeout: 20000 });
      await expect(page.locator('h1')).toContainText('Hello');
    });
  });

  test('should complete email verification flow with actual email', async ({ page, browserName }) => {
    await allure.story('Hono Email Code Verification Flow with Real Email');
    await allure.severity('critical');
    await allure.tag('hono-email-verification-real');
    
    let extractedLoginFlowId = '';

    // Go to the app home page
    await allure.step('Navigate to Hono app home page', async () => {
      await page.goto('http://localhost:3000');
    });

    // Click log in button
    await allure.step('Click login button', async () => {
      await page.locator('[data-testid="civic-login-oidc-button-dummy"]').click({ timeout: 20000 });
    });

    // Wait for navigation to auth server
    await allure.step('Wait for auth server navigation', async () => {
      await page.waitForURL('**/auth-dev.civic.com/**', { timeout: 30000 });
    });

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

    // Wait for redirect to callback and then to hello page
    await allure.step('Wait for redirect to hello page', async () => {
      await expect(page).toHaveURL(/.*\/admin\/hello/, { timeout: 30000 });
      await expect(page.locator('h1')).toContainText('Hello');
    });
  });
});
