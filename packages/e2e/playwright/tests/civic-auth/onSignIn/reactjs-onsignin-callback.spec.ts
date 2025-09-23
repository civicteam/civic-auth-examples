import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Civic Auth onSignIn Callback Tests', () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Civic Auth Applications');
    await allure.suite('onSignIn Callback');
    await allure.feature('React.js onSignIn Callback');
  });

  test('should call onSignIn callback on successful login', async ({ page, browserName }) => {
    await allure.story('React.js onSignIn Success Callback');
    await allure.severity('critical');
    await allure.tag('reactjs-onsignin-success');

    // Track console logs to verify onSignIn callback execution
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Open the app home page
    await allure.step('Navigate to React.js app home page', async () => {
      await page.goto('http://localhost:3000/onsignin-test');
    });
    
    // Wait for the page to fully load with all UI elements
    await allure.step('Wait for page to load', async () => {
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
    });
    
    // Wait for the UserButton to be visible (the one that says "Sign in")
    await allure.step('Wait for sign in button', async () => {
      await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 10000 });
    });
    
    // Click the UserButton "Sign in" button
    await allure.step('Click sign in button', async () => {
      await page.getByTestId('sign-in-button').click();
    });
    
    // Wait for iframe to appear and load
    await allure.step('Wait for auth iframe', async () => {
      await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for the iframe to be gone (indicating login is complete)
    await allure.step('Wait for login completion', async () => {
      await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    });
    
    // Confirm logged in state by checking for Ghost button in dropdown
    await allure.step('Verify successful login', async () => {
      await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
    });

    // Verify onSignIn callback was called with success (no error)
    await allure.step('Verify onSignIn callback was called on success', async () => {
      // Wait a bit for any async callbacks to complete
      await page.waitForTimeout(2000);
      
      // Check console logs for onSignIn callback execution
      const onSignInLogs = consoleLogs.filter(log => 
        log.includes('onSignIn callback') || 
        log.includes('Sign in completed successfully')
      );
      
      // Should have at least one log indicating successful callback execution
      expect(onSignInLogs.length).toBeGreaterThan(0);
      
      // Verify no error was passed to the callback
      const errorLogs = consoleLogs.filter(log => 
        log.includes('onSignIn error') || 
        log.includes('Sign in failed')
      );
      expect(errorLogs.length).toBe(0);
    });
  });

  test('should call onSignIn callback on failed login', async ({ page, browserName }) => {
    await allure.story('React.js onSignIn Error Callback');
    await allure.severity('critical');
    await allure.tag('reactjs-onsignin-error');

    // Track console logs to verify onSignIn callback execution
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Intercept auth requests to simulate failure
    await page.route('**auth-dev.civic.com/**', async (route) => {
      await route.abort('failed');
    });

    // Open the app home page
    await allure.step('Navigate to React.js app home page', async () => {
      await page.goto('http://localhost:3000/onsignin-test');
    });
    
    // Wait for the page to fully load with all UI elements
    await allure.step('Wait for page to load', async () => {
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
    });
    
    // Wait for the UserButton to be visible (the one that says "Sign in")
    await allure.step('Wait for sign in button', async () => {
      await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 10000 });
    });
    
    // Click the UserButton "Sign in" button
    await allure.step('Click sign in button', async () => {
      await page.getByTestId('sign-in-button').click();
    });
    
    // Wait for iframe to appear and load
    await allure.step('Wait for auth iframe', async () => {
      await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    });
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Look for the dummy button
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.click({ timeout: 20000 });

    // Wait for error to occur (iframe should remain visible or show error)
    await allure.step('Wait for login failure', async () => {
      // Wait for either error state or iframe to remain visible
      await page.waitForTimeout(5000);
    });

    // Verify onSignIn callback was called with error
    await allure.step('Verify onSignIn callback was called with error', async () => {
      // Wait a bit for any async callbacks to complete
      await page.waitForTimeout(2000);
      
      // Check console logs for onSignIn callback execution with error
      const onSignInLogs = consoleLogs.filter(log => 
        log.includes('onSignIn callback') || 
        log.includes('Sign in failed')
      );
      
      // Should have at least one log indicating error callback execution
      expect(onSignInLogs.length).toBeGreaterThan(0);
      
      // Verify error was passed to the callback
      const errorLogs = consoleLogs.filter(log => 
        log.includes('onSignIn error') || 
        log.includes('Sign in failed')
      );
      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });
});
