/**
 * Virtual Authenticator Helper for Playwright tests
 * Follows the Cypress pattern: cy.addVirtualAuthenticator().then((id: string) => { ... })
 */

export class VirtualAuthenticatorHelper {
  private authenticatorId: string | null = null;
  private client: any = null;

  /**
   * Set up virtual authenticator following Cypress pattern
   * Equivalent to: cy.addVirtualAuthenticator().then((id: string) => { ... })
   */
  async setupVirtualAuthenticator(page: any): Promise<string> {
    // Set up CDP session
    this.client = await page.context().newCDPSession(page);
    await this.client.send('WebAuthn.enable');
    
    // Add virtual authenticator
    const result = await this.client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true
      }
    });
    
    this.authenticatorId = result.authenticatorId;
    console.log('WebAuthn Virtual Authenticator set up successfully with ID:', this.authenticatorId);
    
    // Set user as verified
    await this.client.send('WebAuthn.setUserVerified', {
      authenticatorId: this.authenticatorId,
      isUserVerified: true,
    });
    
    // Enable automatic presence simulation
    await this.client.send('WebAuthn.setAutomaticPresenceSimulation', {
      authenticatorId: this.authenticatorId,
      enabled: true
    });
    
    // Enable WebAuthn API and override platform authenticator check
    await this.enableWebAuthnAPI(page);
    
    return this.authenticatorId!;
  }

  /**
   * Enable WebAuthn API and override platform authenticator check
   * Equivalent to: cy.enableWebAuthnAPI()
   */
  private async enableWebAuthnAPI(page: any): Promise<void> {
    await page.context().addInitScript(() => {
      console.log('Enabling WebAuthn API...');
      
      // Override WebAuthn support checks to always return true
      if (window.PublicKeyCredential) {
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () => {
          console.log('WebAuthn support check called - returning true');
          return Promise.resolve(true);
        };
        
        window.PublicKeyCredential.isConditionalMediationAvailable = () => {
          console.log('Conditional mediation check called - returning true');
          return Promise.resolve(true);
        };
        
        if (!(window.PublicKeyCredential as any).isExternalCTAP2SecurityKeySupported) {
          (window.PublicKeyCredential as any).isExternalCTAP2SecurityKeySupported = () => {
            console.log('External CTAP2 security key check called - returning true');
            return Promise.resolve(true);
          };
        }
      } else {
        // Create PublicKeyCredential if it doesn't exist
        (window as any).PublicKeyCredential = {
          isUserVerifyingPlatformAuthenticatorAvailable: () => Promise.resolve(true),
          isConditionalMediationAvailable: () => Promise.resolve(true),
          isExternalCTAP2SecurityKeySupported: () => Promise.resolve(true)
        };
      }
      

      
      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: false
      });
      
      console.log('WebAuthn API enabled');
    });
  }

  /**
   * Set up event listeners for debugging
   */
  setupEventListeners(): void {
    if (!this.client) {
      throw new Error('Virtual authenticator not set up. Call setupVirtualAuthenticator() first.');
    }

    this.client.on('WebAuthn.credentialAdded', (event: any) => {
      console.log('Credential added:', event);
    });
    
    this.client.on('WebAuthn.credentialAsserted', (event: any) => {
      console.log('Credential asserted:', event);
    });
    
    (this.client as any).on('WebAuthn.authenticatorSelected', (event: any) => {
      console.log('Authenticator selected:', event);
    });
    
    (this.client as any).on('WebAuthn.authenticatorDeselected', (event: any) => {
      console.log('Authenticator deselected:', event);
    });
  }

  /**
   * Ensure user is verified
   */
  async setUserVerified(isVerified: boolean = true): Promise<void> {
    if (!this.authenticatorId || !this.client) {
      throw new Error('Virtual authenticator not set up. Call setupVirtualAuthenticator() first.');
    }

    await this.client.send('WebAuthn.setUserVerified', {
      authenticatorId: this.authenticatorId,
      isUserVerified: isVerified,
    });
  }

  /**
   * Get credentials from virtual authenticator
   */
  async getCredentials(): Promise<any> {
    if (!this.authenticatorId || !this.client) {
      throw new Error('Virtual authenticator not set up. Call setupVirtualAuthenticator() first.');
    }

    return await this.client.send('WebAuthn.getCredentials', {
      authenticatorId: this.authenticatorId!
    });
  }

  /**
   * Clean up virtual authenticator
   */
  async cleanup(): Promise<void> {
    if (this.authenticatorId && this.client) {
      try {
        await this.client.send('WebAuthn.removeVirtualAuthenticator', {
          authenticatorId: this.authenticatorId
        });
        console.log('Virtual authenticator cleaned up');
      } catch (error) {
        console.log('Error cleaning up authenticator:', error);
      }
    }
  }

  /**
   * Get the authenticator ID
   */
  getAuthenticatorId(): string | null {
    return this.authenticatorId;
  }
}
