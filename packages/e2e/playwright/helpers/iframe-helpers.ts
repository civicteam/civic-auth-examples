import { Page, FrameLocator, expect } from '@playwright/test';

/**
 * Waits for the Civic Auth iframe to be present and fully loaded with content.
 * This is more robust than just waiting for the iframe element to exist.
 * 
 * @param page - The Playwright page object
 * @param options - Configuration options
 * @returns The frame locator for the loaded iframe
 */
export async function waitForCivicIframeToLoad(
  page: Page,
  options: {
    timeout?: number;
    iframeSelector?: string;
  } = {}
): Promise<FrameLocator> {
  const {
    timeout = 30000,
    iframeSelector = '#civic-auth-iframe'
  } = options;

  await page.waitForSelector(iframeSelector, { state: 'attached', timeout });
  const frame = page.frameLocator(iframeSelector);
  await frame.locator('body').waitFor({ state: 'visible', timeout: 30000 });
  
  return frame;
}

/**
 * Waits for the Civic Auth iframe to close/be removed from the DOM
 * 
 * @param page - The Playwright page object
 * @param options - Configuration options
 */
export async function waitForCivicIframeToClose(
  page: Page,
  options: {
    timeout?: number;
    iframeSelector?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 20000,
    iframeSelector = '#civic-auth-iframe'
  } = options;

  await page.waitForSelector(iframeSelector, { state: 'hidden', timeout }).catch(async () => {
    await page.waitForSelector(iframeSelector, { state: 'detached', timeout: 5000 });
  });
}

/**
 * Debug helper: Logs the current state of the iframe
 * 
 * @param page - The Playwright page object
 * @param frameLocator - The frame locator
 */
export async function debugIframeState(
  page: Page,
  frameLocator: FrameLocator
): Promise<void> {
  const bodyText = await frameLocator.locator('body').textContent({ timeout: 5000 }).catch(() => '');
  const allButtons = frameLocator.locator('button');
  const buttonCount = await allButtons.count().catch(() => 0);
  
  console.log(`Iframe debug: ${bodyText?.length || 0} chars, ${buttonCount} buttons`);
}

