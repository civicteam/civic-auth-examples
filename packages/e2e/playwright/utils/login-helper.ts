import { Page, expect } from '@playwright/test';

interface LoginWithDummyOptions {
  /** Custom selector for the sign-in trigger button (default: uses testId 'sign-in-button') */
  signInSelector?: string;
  /** Timeout for the iframe to disappear after login completes (default: 60000) */
  iframeHideTimeout?: number;
  /** Max number of times to retry clicking the dummy button if iframe doesn't hide (default: 2) */
  maxRetries?: number;
}

/**
 * Performs a full dummy login flow: clicks sign-in, waits for the auth iframe,
 * clicks the dummy OIDC button, and waits for the iframe to disappear.
 * Includes retry logic for the dummy button click to handle flaky CI environments.
 */
export async function loginWithDummy(page: Page, options?: LoginWithDummyOptions) {
  const {
    signInSelector,
    iframeHideTimeout = 60_000,
    maxRetries = 2,
  } = options ?? {};

  // Step 1: Click the sign-in trigger
  if (signInSelector) {
    await page.waitForSelector(signInSelector, { timeout: 30_000 });
    await page.locator(signInSelector).click();
  } else {
    const signInButton = page.getByTestId('sign-in-button');
    await signInButton.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(signInButton).toBeEnabled({ timeout: 10_000 });
    await signInButton.click();
  }

  // Step 2: Wait for the auth iframe to attach
  await page.waitForSelector('#civic-auth-iframe', { state: 'attached', timeout: 30_000 });
  const frame = page.frameLocator('#civic-auth-iframe');
  await frame.locator('body').waitFor({ timeout: 30_000 });

  // Step 3: Wait for the login UI to finish loading
  try {
    const loadingElement = frame.locator('#civic-login-app-loading');
    if (await loadingElement.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await loadingElement.waitFor({ state: 'hidden', timeout: 45_000 });
    }
  } catch {
    // Loading element might not exist
  }

  await frame.locator('[data-testid*="civic-login"]').first().waitFor({ timeout: 30_000 });

  // Step 4: Click the dummy button (with retry logic)
  const dummyButton = frame.locator('[data-testid="civic-login-oidc-button-dummy"]');
  await dummyButton.waitFor({ state: 'visible', timeout: 30_000 });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await page.waitForTimeout(500);
    await dummyButton.click({ timeout: 20_000 });

    // Wait for post-click loading spinner
    try {
      const loadingAfterClick = frame.locator('#civic-login-app-loading');
      if (await loadingAfterClick.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await loadingAfterClick.waitFor({ state: 'hidden', timeout: 30_000 });
      }
    } catch {
      // Loading handling - continue
    }

    // Check if iframe started hiding within a reasonable window
    const perAttemptTimeout = attempt < maxRetries ? 20_000 : iframeHideTimeout;
    try {
      await page.waitForSelector('#civic-auth-iframe', {
        state: 'hidden',
        timeout: perAttemptTimeout,
      });
      return; // Success
    } catch {
      if (attempt < maxRetries) {
        console.log(`Dummy login attempt ${attempt + 1} didn't complete, retrying...`);
      } else {
        throw new Error(
          `Auth iframe did not hide after ${maxRetries + 1} attempts (total timeout: ~${iframeHideTimeout}ms)`,
        );
      }
    }
  }
}
