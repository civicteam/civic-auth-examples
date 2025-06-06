import { test, expect } from '@playwright/test';

test.describe('Fastify Login Tests', () => {
  test('should complete login flow and redirect to hello page', async ({ page }) => {
    // Intercept the external Civic auth server and redirect back to your app
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

    // Intercept your app's callback and set the cookie, then redirect to /admin/hello
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

    // Go to the app home page
    await page.goto('http://localhost:3000');

    // Click log in button
    await page.locator('[data-testid="civic-login-oidc-button-dummy"]').click({ timeout: 20000 });

    // Now you can immediately check the URL and page content
    await expect(page).toHaveURL(/.*\/admin\/hello/, { timeout: 20000 });
    await expect(page.locator('h1')).toContainText('Hello');
  });
}); 