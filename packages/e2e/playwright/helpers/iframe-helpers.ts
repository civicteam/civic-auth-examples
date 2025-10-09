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
    timeout = 60000, // Increase timeout for CI - 60 seconds
    iframeSelector = '#civic-auth-iframe'
  } = options;

  console.log(`[Iframe Helper] Waiting for iframe ${iframeSelector} to load...`);

  // Step 1: Wait for the iframe element to be attached to DOM
  await page.waitForSelector(iframeSelector, { 
    state: 'attached', 
    timeout 
  });
  console.log(`[Iframe Helper] Iframe element found in DOM`);

  // Step 2: Get the frame locator
  const frame = page.frameLocator(iframeSelector);

  // Step 3: Wait for the iframe to have actual content by checking multiple signals
  await Promise.race([
    // Option A: Wait for body to have more than just whitespace
    (async () => {
      let attempts = 0;
      const maxAttempts = timeout / 1000; // Check every second
      
      while (attempts < maxAttempts) {
        try {
          const bodyLocator = frame.locator('body');
          await bodyLocator.waitFor({ timeout: 2000 });
          
          // Check if body has actual content (not empty)
          const hasContent = await bodyLocator.evaluate((el) => {
            const text = el.textContent || '';
            const hasText = text.trim().length > 0;
            const hasChildren = el.children.length > 0;
            const hasVisibleChildren = Array.from(el.children).some(
              child => window.getComputedStyle(child).display !== 'none'
            );
            return hasText || hasChildren || hasVisibleChildren;
          }).catch(() => false);
          
          if (hasContent) {
            console.log(`[Iframe Helper] Body has content after ${attempts} attempts`);
            return;
          }
        } catch (error) {
          // Body not ready yet
        }
        
        await page.waitForTimeout(1000);
        attempts++;
      }
      
      throw new Error(`Iframe body remained empty after ${maxAttempts} seconds`);
    })(),
    
    // Option B: Wait for loading spinner to disappear
    (async () => {
      try {
        const loadingElement = frame.locator('#civic-login-app-loading');
        const isVisible = await loadingElement.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (isVisible) {
          console.log(`[Iframe Helper] Waiting for loading spinner to disappear...`);
          await loadingElement.waitFor({ state: 'hidden', timeout: timeout - 5000 });
          console.log(`[Iframe Helper] Loading spinner hidden`);
        }
      } catch (error) {
        // Loading element might not exist, continue
      }
    })(),
    
    // Option C: Wait for any civic login element to appear
    (async () => {
      const loginElements = frame.locator('[data-testid*="civic-login"], [data-testid*="civic-auth"], button');
      await loginElements.first().waitFor({ timeout });
      console.log(`[Iframe Helper] Login elements found`);
    })()
  ]);

  // Step 4: Add a small buffer to ensure everything is settled
  await page.waitForTimeout(2000);

  console.log(`[Iframe Helper] Iframe fully loaded and ready`);
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
    timeout = 30000,
    iframeSelector = '#civic-auth-iframe'
  } = options;

  console.log(`[Iframe Helper] Waiting for iframe to close...`);
  
  await page.waitForSelector(iframeSelector, { 
    state: 'hidden', 
    timeout 
  }).catch(async () => {
    // If hidden state doesn't work, try detached
    await page.waitForSelector(iframeSelector, { 
      state: 'detached', 
      timeout: 10000 
    });
  });
  
  console.log(`[Iframe Helper] Iframe closed`);
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
  console.log(`[Iframe Debug] === Iframe State Debug ===`);
  
  try {
    const bodyText = await frameLocator.locator('body').textContent({ timeout: 5000 });
    console.log(`[Iframe Debug] Body text length: ${bodyText?.length || 0}`);
    console.log(`[Iframe Debug] Body text (first 200 chars): "${bodyText?.substring(0, 200)}"`);
  } catch (error) {
    console.log(`[Iframe Debug] Could not get body text:`, error);
  }
  
  try {
    const allElements = frameLocator.locator('*');
    const elementCount = await allElements.count();
    console.log(`[Iframe Debug] Total elements in iframe: ${elementCount}`);
  } catch (error) {
    console.log(`[Iframe Debug] Could not count elements:`, error);
  }
  
  try {
    const allButtons = frameLocator.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`[Iframe Debug] Total buttons in iframe: ${buttonCount}`);
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent().catch(() => '');
      const testId = await button.getAttribute('data-testid').catch(() => '');
      console.log(`[Iframe Debug] Button ${i}: text="${text}", data-testid="${testId}"`);
    }
  } catch (error) {
    console.log(`[Iframe Debug] Could not inspect buttons:`, error);
  }
  
  console.log(`[Iframe Debug] === End Debug ===`);
}

