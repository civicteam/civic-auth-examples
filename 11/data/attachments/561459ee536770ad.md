# Test info

- Name: Civic Auth Applications >> should complete email verification flow with actual email
- Location: /home/runner/work/civic-auth-examples/civic-auth-examples/packages/e2e/playwright/tests/civic-auth/email/hono-email-verification.spec.ts:13:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at /home/runner/.cache/ms-playwright/webkit-2158/pw_run.sh
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     yarn playwright install                                             ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { allure } from 'allure-playwright';
   3 | import { db } from '../../../../utils/database';
   4 | import { generateUniqueEmail } from '../../../utils/email-generator';
   5 |
   6 | test.describe('Civic Auth Applications', () => {
   7 |   test.beforeEach(async ({ page }) => {
   8 |     await allure.epic('Civic Auth Applications');
   9 |     await allure.suite('Email');
   10 |     await allure.feature('Hono Email Verification');
   11 |   });
   12 |
>  13 |   test('should complete email verification flow with actual email', async ({ page, browserName }) => {
      |       ^ Error: browserType.launch: Executable doesn't exist at /home/runner/.cache/ms-playwright/webkit-2158/pw_run.sh
   14 |     await allure.story('Hono Email Code Verification Flow with Real Email');
   15 |     await allure.severity('critical');
   16 |     await allure.tag('hono-email-verification-real');
   17 |     
   18 |     let extractedLoginFlowId = '';
   19 |     const uniqueEmail = generateUniqueEmail();
   20 |
   21 |     // Go to the app home page
   22 |     await allure.step('Navigate to Hono app home page', async () => {
   23 |       await page.goto('http://localhost:3000');
   24 |     });
   25 |
   26 |     // Wait for the page to fully load with all UI elements
   27 |     await page.waitForLoadState('networkidle');
   28 |     await page.waitForLoadState('domcontentloaded');
   29 |
   30 |     // Click "Log in with email" button
   31 |     await allure.step('Click email login option', async () => {
   32 |       const emailButton = page.locator('[data-testid="civic-login-slot-email-comp"]');
   33 |       await emailButton.waitFor({ timeout: 30000 });
   34 |       await emailButton.click();
   35 |     });
   36 |
   37 |     // Enter email address
   38 |     await allure.step('Enter email address', async () => {
   39 |       const emailInput = page.locator('[data-testid="email-input-text"]');
   40 |       await emailInput.waitFor({ timeout: 10000 });
   41 |       await emailInput.fill(uniqueEmail);
   42 |     });
   43 |
   44 |     // Submit email form and wait for API response
   45 |     await allure.step('Submit email form and intercept API call', async () => {
   46 |       const responsePromise = page.waitForResponse(
   47 |         response => {
   48 |           const url = response.url();
   49 |           const hasLoginFlowId = url.includes('loginFlowId');
   50 |           const isEmailEndpoint = url.includes('/email') && response.request().method() === 'GET' && url.includes('?');
   51 |           const isVerifyEndpoint = url.includes('/verify') || url.includes('/send-code');
   52 |           return hasLoginFlowId || isEmailEndpoint || isVerifyEndpoint;
   53 |         },
   54 |         { timeout: 30000 }
   55 |       );
   56 |
   57 |       const submitButton = page.locator('button svg.lucide-arrow-right').locator('..');
   58 |       await submitButton.waitFor({ timeout: 10000 });
   59 |       await submitButton.click();
   60 |
   61 |       const emailResponse = await responsePromise;
   62 |       const emailUrl = emailResponse.url();
   63 |       console.log('Email verification URL:', emailUrl);
   64 |
   65 |       const urlParams = new URLSearchParams(emailUrl.split('?')[1]);
   66 |       let loginFlowId = urlParams.get('loginFlowId') || '';
   67 |
   68 |       console.log('Extracted loginFlowId:', loginFlowId);
   69 |
   70 |       if (!loginFlowId) {
   71 |         throw new Error(`No loginFlowId found in URL: ${emailUrl}`);
   72 |       }
   73 |
   74 |       extractedLoginFlowId = loginFlowId;
   75 |     });
   76 |
   77 |     // Wait for and retrieve verification code from database
   78 |     await allure.step('Wait for verification code and retrieve from API', async () => {
   79 |       const loginFlowId = extractedLoginFlowId;
   80 |
   81 |       // Wait for the code input fields to appear
   82 |       await page.locator('[data-testid="code-input-0"]').waitFor({ timeout: 30000 });
   83 |
   84 |       // Connect to database and retrieve the actual verification code
   85 |       await db.connect();
   86 |       const verificationCode = await db.waitForEmailCode(loginFlowId, 15, 2000);
   87 |       await db.disconnect();
   88 |
   89 |       console.log(`Retrieved verification code: ${verificationCode} for loginFlowId: ${loginFlowId}`);
   90 |
   91 |       // Enter each digit of the code
   92 |       for (let i = 0; i < verificationCode.length; i++) {
   93 |         const digitInput = page.locator(`[data-testid="code-input-${i}"]`);
   94 |         await digitInput.fill(verificationCode[i]);
   95 |       }
   96 |     });
   97 |
   98 |     // Wait for redirect to callback and then to hello page
   99 |     await allure.step('Wait for redirect to hello page', async () => {
  100 |       await expect(page).toHaveURL(/.*\/admin\/hello/, { timeout: 30000 });
  101 |       await expect(page.locator('h1')).toContainText('Hello');
  102 |     });
  103 |   });
  104 | });
  105 |
```