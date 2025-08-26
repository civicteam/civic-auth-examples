/**
 * Passkey testing utilities for Playwright tests
 * Provides WebAuthn API mocking and credential management for testing passkey authentication
 */

export interface MockCredential {
  id: string;
  type: 'public-key';
  rawId: ArrayBuffer;
  response: {
    clientDataJSON: ArrayBuffer;
    attestationObject?: ArrayBuffer;
    authenticatorData?: ArrayBuffer;
    signature?: ArrayBuffer;
    userHandle?: ArrayBuffer;
  };
}

export class PasskeyHelper {
  private credentials: Map<string, MockCredential> = new Map();

  /**
   * Set up WebAuthn API mocking for passkey testing
   */
  static setupWebAuthnMock(page: any): void {
    page.addInitScript(() => {
      // Mock the WebAuthn API more comprehensively
      if (!window.navigator.credentials) {
        (window.navigator as any).credentials = {
          create: async (options: any) => {
            // Simulate successful credential creation
            const credentialId = new Uint8Array(32);
            crypto.getRandomValues(credentialId);
            
            return {
              id: credentialId,
              type: 'public-key',
              rawId: credentialId.buffer,
              response: {
                clientDataJSON: new ArrayBuffer(64),
                attestationObject: new ArrayBuffer(128)
              }
            };
          },
          get: async (options: any) => {
            // Simulate successful credential retrieval
            const credentialId = new Uint8Array(32);
            crypto.getRandomValues(credentialId);
            
            return {
              id: credentialId,
              type: 'public-key',
              rawId: credentialId.buffer,
              response: {
                clientDataJSON: new ArrayBuffer(64),
                authenticatorData: new ArrayBuffer(64),
                signature: new ArrayBuffer(64),
                userHandle: new ArrayBuffer(32)
              }
            };
          }
        };
      }

      // Mock additional WebAuthn properties that might be checked
      if (!window.PublicKeyCredential) {
        (window as any).PublicKeyCredential = {
          isUserVerifyingPlatformAuthenticatorAvailable: () => Promise.resolve(true),
          isConditionalMediationAvailable: () => Promise.resolve(true),
          isExternalCTAP2SecurityKeySupported: () => Promise.resolve(true)
        };
      }

      // Mock the authenticator availability check
      if (window.PublicKeyCredential) {
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () => Promise.resolve(true);
        window.PublicKeyCredential.isConditionalMediationAvailable = () => Promise.resolve(true);
      }
    });
  }

  /**
   * Set up WebAuthn API mocking with existing credentials
   */
  static setupWebAuthnMockWithCredentials(page: any, credentials: MockCredential[]): void {
    page.addInitScript((creds: MockCredential[]) => {
      if (!window.navigator.credentials) {
        (window.navigator as any).credentials = {
          create: async (options: any) => {
            throw new Error('Credential already exists');
          },
          get: async (options: any) => {
            // Return the first available credential
            if (creds.length > 0) {
              return creds[0];
            }
            throw new Error('No credentials found');
          }
        };
      }
    }, credentials);
  }

  /**
   * Set up WebAuthn API mocking that fails
   */
  static setupWebAuthnMockFailure(page: any, errorMessage: string = 'User cancelled'): void {
    page.addInitScript((error: string) => {
      if (!window.navigator.credentials) {
        (window.navigator as any).credentials = {
          create: async (options: any) => {
            throw new Error(error);
          },
          get: async (options: any) => {
            throw new Error(error);
          }
        };
      }
    }, errorMessage);
  }

  /**
   * Create a mock credential for testing
   */
  static createMockCredential(userId: string): MockCredential {
    const credentialId = new Uint8Array(32);
    crypto.getRandomValues(credentialId);
    
    return {
      id: credentialId.toString(),
      type: 'public-key',
      rawId: credentialId.buffer,
      response: {
        clientDataJSON: new ArrayBuffer(64),
        attestationObject: new ArrayBuffer(128)
      }
    };
  }

  /**
   * Generate a unique test user for passkey testing
   */
  static generateTestUser(prefix: string = 'passkey-test'): {
    email: string;
    userId: string;
    credentialId: string;
  } {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    
    return {
      email: `${prefix}-${timestamp}-${randomSuffix}@test.example.com`,
      userId: `user-${timestamp}-${randomSuffix}`,
      credentialId: `credential-${timestamp}-${randomSuffix}`
    };
  }

  /**
   * Wait for passkey prompt to appear
   */
  static async waitForPasskeyPrompt(page: any, timeout: number = 30000): Promise<void> {
    try {
      // Wait for passkey prompt in main page
      await page.waitForSelector('text=Log in with a passkey', { timeout });
    } catch (error) {
      // If not found in main page, try in iframe
      const frame = page.frameLocator('#civic-auth-iframe');
      await frame.locator('text=Log in with a passkey').waitFor({ timeout });
    }
  }

  /**
   * Wait for passkey error to appear
   */
  static async waitForPasskeyError(page: any, timeout: number = 30000): Promise<void> {
    try {
      // Wait for passkey error in main page
      await page.waitForSelector('[data-testid="passkey-error"]', { timeout });
    } catch (error) {
      // If not found in main page, try in iframe
      const frame = page.frameLocator('#civic-auth-iframe');
      await frame.locator('[data-testid="passkey-error"]').waitFor({ timeout });
    }
  }

  /**
   * Click passkey login button (all browsers use redirect flow for passkey)
   */
  static async clickPasskeyButton(page: any, browserName: string): Promise<void> {
    // All browsers use redirect flow for passkey authentication
    await page.waitForURL('**/auth-dev.civic.com/**', { timeout: 30000 });
    
    // // Click the Dummy button first
    // const dummyButton = page.locator('button:has-text("Dummy")');
    // await dummyButton.waitFor({ timeout: 30000 });
    // await dummyButton.click();
    
    // Wait for the "Log in with a passkey" screen to appear (this replaces the "I have a passkey" link)
    await page.click('text=Log in with a passkey', { timeout: 30000 });
  }

  /**
   * Handle first-time passkey creation flow
   */
  static async handleFirstTimePasskeyFlow(page: any): Promise<void> {
    // Wait for the "Log in with a passkey" screen to appear
    await page.waitForSelector('text=Log in with a passkey', { timeout: 30000 });
    
    // Check if we have the "Unable to check passkey support" banner
    const supportBanner = page.locator('text=Unable to check passkey support on this device');
    const hasSupportIssue = await supportBanner.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasSupportIssue) {
      console.log('Passkey support check failed - this is expected in test environment');
      // In test environment, we might need to click "Skip for now" or wait for the button to become available
      const skipButton = page.locator('text=Skip for now');
      if (await skipButton.isVisible({ timeout: 5000 })) {
        await skipButton.click();
        return;
      }
    }
    
    // Try to find and click "Create passkey" button
    const createPasskeyButton = page.locator('button:has-text("Create passkey")');
    const buttonExists = await createPasskeyButton.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (buttonExists) {
      await createPasskeyButton.click();
    } else {
      // If no "Create passkey" button, look for a button with loading spinner
      const loadingButton = page.locator('button:has([class*="spinner"])');
      if (await loadingButton.isVisible({ timeout: 5000 })) {
        console.log('Found loading button - waiting for it to complete...');
        // Wait for the loading to complete
        await page.waitForTimeout(3000);
      }
    }
  }

  /**
   * Handle existing passkey login flow
   */
  static async handleExistingPasskeyFlow(page: any): Promise<void> {
    // Wait for the "Log in with a passkey" screen to appear
    await page.waitForSelector('text=Log in with a passkey', { timeout: 30000 });
    
    // For existing users, the passkey prompt should appear automatically
    // or they might need to click "Skip for now" if they don't want to create a new one
    const skipButton = page.locator('text=Skip for now');
    if (await skipButton.isVisible({ timeout: 5000 })) {
      await skipButton.click();
    }
  }
}

/**
 * Database utilities for passkey testing
 */
export class PasskeyDatabaseHelper {
  private db: any;

  constructor(databaseUtil: any) {
    this.db = databaseUtil;
  }

  /**
   * Create a test user with passkey credentials in the database
   */
  async createTestUserWithPasskey(userData: {
    email: string;
    userId: string;
    credentialId: string;
    publicKey: string;
  }): Promise<void> {
    // This would typically insert the user and their passkey credentials
    // into your database tables
    console.log('Creating test user with passkey:', userData);
    
    // Example SQL (you'll need to adapt this to your actual schema):
    // await this.db.client.query(`
    //   INSERT INTO users (id, email, created_at) 
    //   VALUES ($1, $2, NOW())
    //   ON CONFLICT (id) DO NOTHING
    // `, [userData.userId, userData.email]);
    
    // await this.db.client.query(`
    //   INSERT INTO passkey_credentials (id, user_id, public_key, created_at)
    //   VALUES ($1, $2, $3, NOW())
    //   ON CONFLICT (id) DO NOTHING
    // `, [userData.credentialId, userData.userId, userData.publicKey]);
  }

  /**
   * Clean up test user and their passkey credentials
   */
  async cleanupTestUser(userId: string): Promise<void> {
    // Clean up test data
    console.log('Cleaning up test user:', userId);
    
    // Example SQL (you'll need to adapt this to your actual schema):
    // await this.db.client.query('DELETE FROM passkey_credentials WHERE user_id = $1', [userId]);
    // await this.db.client.query('DELETE FROM users WHERE id = $1', [userId]);
  }
}
