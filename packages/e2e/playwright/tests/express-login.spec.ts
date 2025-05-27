import { test, expect } from '@playwright/test';

test.describe('Express Login Tests', () => {
  test('should complete login flow and redirect to hello page', async ({ page }) => {
    // Open the app home page
    await page.goto('http://localhost:3000');
    
    // Wait for and click log in with dummy button directly on the page
    await page.locator('[data-testid="civic-login-oidc-button-dummy"]').click({ timeout: 20000 });

    // Wait for the auth callback to complete
    await page.waitForResponse(response => 
      response.url().includes('/auth/callback') && response.status() === 302
    );

    // Verify we are redirected to the hello page
    await expect(page).toHaveURL(/.*\/admin\/hello/, { timeout: 20000 });
    
    // Verify the hello page content
    await expect(page.locator('h1')).toContainText('Hello');
  });
}); 