import { test, expect } from '@playwright/test';

test.describe('Next.js Login Tests (BasePath)', () => {
  test('should complete full login and logout flow with basepath', async ({ page, browserName }) => {
    // Configure test to be more resilient
    test.setTimeout(120000); // Increase timeout to 2 minutes
    
    // Monitor network requests to debug potential auth flow issues
    const failedRequests: any[] = [];
    page.on('requestfailed', request => {
      console.log('Failed request:', request.url(), request.failure()?.errorText);
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
    });
    
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('HTTP error response:', response.status(), response.url());
      }
    });
    // Open the app home page with basepath
    await page.goto('http://localhost:3000/demo');

    // Wait for the page to fully load with all UI elements
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click the sign in button using test ID
    await page.getByTestId('sign-in-button').click();
    
    // Wait for iframe to appear and load
    console.log('Waiting for civic-auth-iframe to appear...');
    await page.waitForSelector('#civic-auth-iframe', { timeout: 30000 });
    console.log('Iframe found successfully');
    
    // Click log in with dummy in the iframe
    const frame = page.frameLocator('#civic-auth-iframe');
    
    // Try to wait for the frame to load completely first
    await frame.locator('body').waitFor({ timeout: 30000 });
    
    // Wait for the login UI to fully load (not just the loading spinner)
    console.log('Checking for loading spinner...');
    try {
      const loadingElement = frame.locator('#civic-login-app-loading');
      const isLoadingVisible = await loadingElement.isVisible({ timeout: 5000 }).catch(() => false);
      console.log('Loading spinner visible:', isLoadingVisible);
      
      if (isLoadingVisible) {
        console.log('Waiting for loading spinner to disappear...');
        await loadingElement.waitFor({ state: 'hidden', timeout: 45000 });
        console.log('Loading spinner disappeared');
      } else {
        console.log('No loading spinner found, proceeding...');
      }
    } catch (error) {
      console.log('Error with loading spinner check:', error instanceof Error ? error.message : String(error));
    }
    
    // Wait for login elements to appear
    await frame.locator('[data-testid*="civic-login"]').first().waitFor({ timeout: 30000 });
    
    // Look for the dummy button with extended timeout and ensure it's visible
    const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
    await dummyButton.waitFor({ state: 'visible', timeout: 30000 });
    
    // Add a small delay to ensure button is fully interactive
    await page.waitForTimeout(1000);
    
    // Click the dummy button and monitor what happens
    console.log('Clicking dummy button...');
    await dummyButton.click({ timeout: 20000 });
    console.log('Dummy button clicked successfully');
    
    // Check if the iframe content changes or if we get stuck
    console.log('Monitoring iframe state after click...');
    
    // Check if loading spinner appears again after click
    try {
      const loadingAfterClick = frame.locator('#civic-login-app-loading');
      const isLoadingVisibleAfterClick = await loadingAfterClick.isVisible({ timeout: 3000 }).catch(() => false);
      console.log('Loading spinner visible after click:', isLoadingVisibleAfterClick);
      
      if (isLoadingVisibleAfterClick) {
        console.log('Loading spinner appeared after click - this might be the issue!');
        console.log('Waiting for spinner to disappear after authentication...');
        
        // Wait longer for the auth flow to complete
        await loadingAfterClick.waitFor({ state: 'hidden', timeout: 60000 });
        console.log('Loading spinner finally disappeared after auth');
      }
    } catch (error) {
      console.log('Error monitoring loading after click:', error instanceof Error ? error.message : String(error));
      console.log('This might indicate the spinner is stuck - checking iframe content...');
      
      // Debug what's actually in the iframe if loading is stuck
      try {
        const iframeContent = await frame.locator('body').textContent({ timeout: 5000 });
        console.log('Iframe content when stuck:', iframeContent);
      } catch (contentError) {
        console.log('Could not get iframe content:', contentError instanceof Error ? contentError.message : String(contentError));
      }
    }

    // Wait for the iframe to be gone (indicating login is complete)
    console.log('Waiting for iframe to disappear...');
    try {
      await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 60000 });
      console.log('Iframe disappeared - login flow completed');
    } catch (error) {
      console.log('Iframe did not disappear - login flow may be stuck');
      console.log('Failed requests during test:', failedRequests);
      
      // Try to get more info about iframe state
      const iframeStillExists = await page.locator('#civic-auth-iframe').isVisible().catch(() => false);
      console.log('Iframe still visible:', iframeStillExists);
      
      if (iframeStillExists) {
        const iframeContent = await page.frameLocator('#civic-auth-iframe').locator('body').textContent().catch(() => 'Could not get content');
        console.log('Final iframe content:', iframeContent);
      }
      
      throw error;
    }
  
    // Confirm logged in state by checking for Ghost button in dropdown
    console.log('Looking for Ghost button in dropdown...');
    const ghostButtonLocator = page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")');
    await expect(ghostButtonLocator).toBeVisible({ timeout: 20000 });
    console.log('Ghost button found - login successful!');
    
    // Verify custom loginSuccessUrl is not loaded (should still be on basepath)
    await expect(page.url()).not.toContain('loginSuccessUrl');
    await expect(page.url()).toContain('/demo');

    // Capture essential cookies after login
    const cookiesAfterLogin = await page.context().cookies();
    const authCookies = cookiesAfterLogin.filter(cookie => 
      cookie.name.includes('civic-auth') || 
      cookie.name.includes('access_token') || 
      cookie.name.includes('refresh_token') ||
      cookie.name.includes('id_token') ||
      cookie.name.includes('session')
    );
    
    // Verify we have essential auth cookies
    expect(authCookies.length).toBeGreaterThan(0);

    // Click the Ghost button in dropdown
    const ghostButton = page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")');
    await ghostButton.waitFor({ state: 'visible', timeout: 10000 });
    await ghostButton.click();

    // Click the logout button
    const logoutButton = page.locator('#civic-dropdown-container').locator('button:has-text("Logout")');
    await logoutButton.waitFor({ state: 'visible', timeout: 10000 });
    await logoutButton.click();
    
    // Confirm successful logout
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
    
    // Verify essential cookies are deleted after logout
    const cookiesAfterLogout = await page.context().cookies();
    const remainingAuthCookies = cookiesAfterLogout.filter(cookie => 
      cookie.name.includes('civic-auth') || 
      cookie.name.includes('access_token') || 
      cookie.name.includes('refresh_token') ||
      cookie.name.includes('id_token') ||
      cookie.name.includes('session')
    );
    
    // Assert that essential auth cookies have been deleted
    expect(remainingAuthCookies.length).toBe(0);
    
    // Additional verification: try to access a protected route to ensure session is cleared
    await page.goto('http://localhost:3000/demo');
    await page.waitForLoadState('networkidle');
    
    // Should be back to logged-out state (Sign In button visible, Ghost button not visible)
    await expect(page.getByTestId('sign-in-button')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
  });
});
