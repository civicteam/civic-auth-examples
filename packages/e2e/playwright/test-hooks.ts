import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Attach videos and screenshots to Allure when tests fail
 * Import this in playwright.config.ts setupMatch
 */
base.afterEach(async ({ page }, testInfo) => {
  // Only process if test failed or timed out
  if (testInfo.status !== 'passed' && testInfo.status !== 'skipped') {
    
    // Attach video if available
    const videoPath = await page.video()?.path().catch(() => null);
    if (videoPath && fs.existsSync(videoPath)) {
      // Wait for video to be fully written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Attach to test info - Allure Playwright will pick this up
      await testInfo.attach('video', {
        path: videoPath,
        contentType: 'video/webm',
      });
    }
  }
});

