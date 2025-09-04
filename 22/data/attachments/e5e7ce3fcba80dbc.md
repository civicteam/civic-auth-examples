# Test info

- Name: Civic Auth Applications >> should complete login flow and redirect to customSuccessRoute
- Location: /__w/civic-auth-examples/civic-auth-examples/packages/e2e/playwright/tests/civic-auth/loginSuccessUrl/express-login.spec.ts:10:7

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ Firefox is unable to launch if the $HOME folder isn't owned by the current user.                                  ║
║ Workaround: Set the HOME=/root environment variable in your GitHub Actions workflow file when running Playwright. ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
Call log:
  - <launching> /ms-playwright/firefox-1482/firefox/firefox -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-1UIhcL -juggler-pipe -silent
  - <launched> pid=878
  - [pid=878][err] Running Nightly as root in a regular user's session is not supported.  ($HOME is /github/home which is owned by uid 1001.)
  - [pid=878] <process did exit: exitCode=1, signal=null>
  - [pid=878] starting temporary directories cleanup

```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { allure } from 'allure-playwright';
   3 |
   4 | test.describe('Civic Auth Applications', () => {
   5 |   test.beforeEach(async ({ page }) => {
   6 |     await allure.epic('Civic Auth Applications');
   7 |     await allure.suite('Login SuccessUrl');
   8 |     await allure.feature('Express Login (LoginSuccessUrl)');
   9 |   });
> 10 |   test('should complete login flow and redirect to customSuccessRoute', async ({ page }) => {
     |       ^ Error: browserType.launch: Target page, context or browser has been closed
  11 |     // Intercept the external Civic auth server and redirect back to your app
  12 |     await page.route('**auth-dev.civic.com/**', async (route) => {
  13 |       const url = new URL(route.request().url());
  14 |       const redirectUri = url.searchParams.get('redirect_uri') || 'http://localhost:3000/auth/callback';
  15 |       await route.fulfill({
  16 |         status: 302,
  17 |         headers: {
  18 |           'location': `${redirectUri}?code=mock-code&state=mock-state`,
  19 |           'content-length': '0',
  20 |           'date': new Date().toUTCString()
  21 |         },
  22 |         body: ''
  23 |       });
  24 |     });
  25 |
  26 |     // Intercept your app's callback and set the cookie, then redirect to /customSuccessRoute
  27 |     await page.route('**/auth/callback*', async (route) => {
  28 |       const nowInSeconds = Math.floor(Date.now() / 1000);
  29 |       const expiresInSeconds = nowInSeconds + 60;
  30 |       const expires = new Date(expiresInSeconds * 1000).toUTCString();
  31 |
  32 |       const mockJwt = {
  33 |         alg: 'RS256',
  34 |         typ: 'JWT',
  35 |         kid: 'civic-auth-token-signer-key'
  36 |       };
  37 |
  38 |       const mockPayload = {
  39 |         sub: 'test-user',
  40 |         exp: expiresInSeconds,
  41 |         iat: nowInSeconds
  42 |       };
  43 |
  44 |       const mockToken = `${Buffer.from(JSON.stringify(mockJwt)).toString('base64')}.${Buffer.from(JSON.stringify(mockPayload)).toString('base64')}.mocksignature`;
  45 |
  46 |       // Fulfill with a script that sets the cookie and redirects to customSuccessRoute
  47 |       await route.fulfill({
  48 |         status: 200,
  49 |         contentType: 'text/html',
  50 |         body: `
  51 |           <script>
  52 |             document.cookie = "id_token=${mockToken}; Path=/; Expires=${expires}; SameSite=Lax";
  53 |             window.location.href = '/customSuccessRoute';
  54 |           </script>
  55 |         `
  56 |       });
  57 |     });
  58 |
  59 |     // Go to the app home page
  60 |     await page.goto('http://localhost:3000');
  61 |
  62 |     // Click log in button
  63 |     await page.locator('[data-testid="civic-login-oidc-button-dummy"]').click({ timeout: 20000 });
  64 |
  65 |     // Now you can immediately check the URL and page content
  66 |     await expect(page).toHaveURL(/.*\/customSuccessRoute/, { timeout: 20000 });
  67 |     await expect(page.locator('h1')).toContainText('Hello');
  68 |   });
  69 | });
  70 |
```