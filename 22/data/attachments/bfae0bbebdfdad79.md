# Test info

- Name: Civic Auth Applications >> should complete full login and logout flow
- Location: /__w/civic-auth-examples/civic-auth-examples/packages/e2e/playwright/tests/civic-auth/reactjs-login.spec.ts:10:7

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ Firefox is unable to launch if the $HOME folder isn't owned by the current user.                                  ║
║ Workaround: Set the HOME=/root environment variable in your GitHub Actions workflow file when running Playwright. ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
Call log:
  - <launching> /ms-playwright/firefox-1482/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-UY0uYA -juggler-pipe -silent
  - <launched> pid=971
  - [pid=971][err] Running Nightly as root in a regular user's session is not supported.  ($HOME is /github/home which is owned by uid 1001.)
  - [pid=971] <process did exit: exitCode=1, signal=null>
  - [pid=971] starting temporary directories cleanup

```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { allure } from 'allure-playwright';
   3 |
   4 | test.describe('Civic Auth Applications', () => {
   5 |   test.beforeEach(async ({ page }) => {
   6 |     await allure.epic('Civic Auth Applications');
   7 |     await allure.suite('Login');
   8 |     await allure.feature('React.js Login');
   9 |   });
> 10 |   test('should complete full login and logout flow', async ({ page, browserName }) => {
     |       ^ Error: browserType.launch: Target page, context or browser has been closed
  11 |     
  12 |     // Open the app home page
  13 |     await page.goto('http://localhost:3000');
  14 |     
  15 |     // Wait for the page to fully load with all UI elements
  16 |     await page.waitForLoadState('networkidle');
  17 |     await page.waitForLoadState('domcontentloaded');
  18 |     
  19 |     // Wait for the UserButton to be visible (the one that says "Sign in")
  20 |     await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 10000 });
  21 |     
  22 |     // Click the UserButton "Sign in" button (not the CustomSignIn button)
  23 |     await page.getByTestId('sign-in-button').click();
  24 |     
  25 |     // Chrome/Firefox use iframe flow
  26 |     // Wait for iframe to appear and load
  27 |     await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
  28 |     
  29 |     // Click log in with dummy in the iframe
  30 |     const frame = page.frameLocator('#civic-auth-iframe');
  31 |     
  32 |     // Try to wait for the frame to load completely first
  33 |     await frame.locator('body').waitFor({ timeout: 30000 });
  34 |     
  35 |     // Look for the dummy button
  36 |     const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
  37 |     await dummyButton.click({ timeout: 20000 });
  38 |
  39 |     // Wait for the iframe to be gone (indicating login is complete)
  40 |     await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
  41 |     
  42 |     // Confirm logged in state by checking for Ghost button in dropdown
  43 |     await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
  44 |     
  45 |     // Verify custom loginSuccessUrl is not loaded
  46 |     await expect(page.url()).not.toContain('loginSuccessUrl');
  47 |
  48 |     // Click the Ghost button in dropdown
  49 |     await page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")').click();
  50 |
  51 |     // Click the logout button
  52 |     await page.locator('#civic-dropdown-container').locator('button:has-text("Logout")').click();
  53 |     
  54 |     // Confirm successful logout
  55 |     await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
  56 |     
  57 |     // Verify token refresh fails after logout
  58 |     const response = await page.request.post('https://auth-dev.civic.com/oauth/token', {
  59 |       form: {
  60 |         grant_type: 'refresh_token',
  61 |         refresh_token: 'storedRefreshToken', // Note: You'll need to get the actual refresh token
  62 |         client_id: process.env.VITE_CLIENT_ID || ''
  63 |       }
  64 |     });
  65 |     expect(response.status()).toBe(400);
  66 |   });
  67 | }); 
```