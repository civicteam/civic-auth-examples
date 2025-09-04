# Test info

- Name: Civic Auth Applications >> should complete email verification flow
- Location: /home/runner/work/civic-auth-examples/civic-auth-examples/packages/e2e/playwright/tests/civic-auth/email/reactjs-email-verification.spec.ts:13:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at /home/runner/.cache/ms-playwright/firefox-1482/firefox/firefox
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
   10 |     await allure.feature('React.js Email Verification');
   11 |   });
   12 |
>  13 |   test('should complete email verification flow', async ({ page, browserName }) => {
      |       ^ Error: browserType.launch: Executable doesn't exist at /home/runner/.cache/ms-playwright/firefox-1482/firefox/firefox
   14 |     await allure.story('React.js Email Code Verification Flow');
   15 |     await allure.severity('critical');
   16 |     await allure.tag('reactjs-email-verification');
   17 |     
   18 |     let extractedLoginFlowId = '';
   19 |     const uniqueEmail = generateUniqueEmail();
   20 |
   21 |     // Open the app home page
   22 |     await allure.step('Navigate to React.js app home page', async () => {
   23 |       await page.goto('http://localhost:3000');
   24 |     });
   25 |     
   26 |     // Wait for the page to fully load with all UI elements
   27 |     await allure.step('Wait for page to load', async () => {
   28 |       await page.waitForLoadState('networkidle');
   29 |       await page.waitForLoadState('domcontentloaded');
   30 |     });
   31 |     
   32 |     // Wait for the UserButton to be visible (the one that says "Sign in")
   33 |     await allure.step('Wait for sign in button', async () => {
   34 |       await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 10000 });
   35 |     });
   36 |     
   37 |     // Click the sign in button using test ID
   38 |     await allure.step('Click sign in button', async () => {
   39 |       await page.getByTestId('sign-in-button').click();
   40 |     });
   41 |     
   42 |     await allure.step('Handle iframe email verification flow', async () => {
   43 |       // Chrome/Firefox use iframe flow
   44 |       // Wait for iframe to appear and load
   45 |       await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
   46 |       
   47 |       // Click log in with email in the iframe
   48 |       const frame = page.frameLocator('#civic-auth-iframe');
   49 |       
   50 |       // Try to wait for the frame to load completely first
   51 |       await frame.locator('body').waitFor({ timeout: 30000 });
   52 |       
   53 |       // Wait for the login UI to fully load (not just the loading spinner)
   54 |       await allure.step('Wait for login UI to load', async () => {
   55 |         // Wait for the login content to appear (no more loading)
   56 |         await frame.locator('#civic-login-app-loading').waitFor({ state: 'hidden', timeout: 30000 });
   57 |         
   58 |         // Alternative: wait for any actual login elements to appear
   59 |         await frame.locator('[data-testid*="civic-login"]').first().waitFor({ timeout: 30000 });
   60 |       });
   61 |       
   62 |       // Look for the email login slot - first check if it's visible
   63 |       await allure.step('Find and click email login option', async () => {
   64 |         // Try to find the email slot component
   65 |         const emailSlot = frame.locator('[data-testid="civic-login-slot-email-comp"]');
   66 |         
   67 |         // Check if email slot exists and is visible
   68 |         const emailSlotCount = await emailSlot.count();
   69 |         console.log(`Email slot count: ${emailSlotCount}`);
   70 |         
   71 |         if (emailSlotCount === 0) {
   72 |           // Email slot not found, might need to look for email input directly
   73 |           console.log('Email slot not found, looking for email input...');
   74 |           const emailInputs = frame.locator('input[type="email"], [data-testid*="email"]');
   75 |           const inputCount = await emailInputs.count();
   76 |           console.log(`Found ${inputCount} email-related inputs`);
   77 |           
   78 |           // Log all inputs to see what's available
   79 |           const allInputs = frame.locator('input');
   80 |           const allInputCount = await allInputs.count();
   81 |           console.log(`Found ${allInputCount} total inputs`);
   82 |           
   83 |           for (let i = 0; i < Math.min(allInputCount, 5); i++) {
   84 |             const input = allInputs.nth(i);
   85 |             const type = await input.getAttribute('type');
   86 |             const testId = await input.getAttribute('data-testid');
   87 |             const placeholder = await input.getAttribute('placeholder');
   88 |             console.log(`Input ${i}: type="${type}", data-testid="${testId}", placeholder="${placeholder}"`);
   89 |           }
   90 |           
   91 |           throw new Error('Email login option not found in iframe');
   92 |         }
   93 |         
   94 |         await emailSlot.waitFor({ timeout: 30000 });
   95 |         await emailSlot.click();
   96 |       });
   97 |       
   98 |       // Enter email address
   99 |       await allure.step('Enter email address in iframe', async () => {
  100 |         const emailInput = frame.locator('[data-testid="email-input-text"]');
  101 |         await emailInput.waitFor({ timeout: 10000 });
  102 |         await emailInput.fill(uniqueEmail);
  103 |       });
  104 |       
  105 |       // Submit email form and wait for API response - use exact selector from Cypress
  106 |       await allure.step('Submit email form and intercept API call', async () => {
  107 |         // Set up the network interception BEFORE clicking submit
  108 |         const responsePromise = page.waitForResponse(
  109 |           response => {
  110 |             const url = response.url();
  111 |             const hasLoginFlowId = url.includes('loginFlowId');
  112 |             const isEmailEndpoint = url.includes('/email') && response.request().method() === 'GET' && url.includes('?');
  113 |             const isVerifyEndpoint = url.includes('/verify') || url.includes('/send-code');
```