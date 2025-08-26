import { Page, BrowserContext } from '@playwright/test';

export class WebAuthnHelper {
    private page: Page;
    private context: BrowserContext;
    private authenticatorId: string | null = null;
    private client: any;

    constructor(page: Page, context: BrowserContext) {
        this.page = page;
        this.context = context;
    }

    async setupWebAuthnEnvironment(): Promise<void> {
        this.client = await this.context.newCDPSession(this.page);

        await this.client.send('WebAuthn.enable');

        const result = await this.client.send('WebAuthn.addVirtualAuthenticator', {
            options: {
                protocol: 'ctap2',
                transport: 'internal',
                hasResidentKey: true, // Changed to true to support resident keys
                hasUserVerification: true,
                isUserVerified: true,
                automaticPresenceSimulation: true,
            },
        });

        this.authenticatorId = result.authenticatorId;
        console.log('Authenticator ID:', this.authenticatorId);
        
        // Override WebAuthn API checks to ensure virtual authenticator is detected
        await this.overrideWebAuthnChecks();
        
        // Add a pre-existing credential to make the authenticator more attractive
        await this.addTestCredential();
    }

    async setUserVerified(isVerified: boolean): Promise<void> {
        if (!this.authenticatorId || !this.client) {
            throw new Error('Authenticator not initialized.');
        }

        await this.client.send('WebAuthn.setUserVerified', {
            authenticatorId: this.authenticatorId,
            isUserVerified: isVerified,
        });
    }

    async overrideWebAuthnChecks(): Promise<void> {
        await this.page.context().addInitScript(() => {
            if (window.PublicKeyCredential) {
                window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () => {
                    console.log('WebAuthn support check called - returning true');
                    return Promise.resolve(true);
                };
                
                window.PublicKeyCredential.isConditionalMediationAvailable = () => {
                    console.log('Conditional mediation check called - returning true');
                    return Promise.resolve(true);
                };
            }
            
            Object.defineProperty(window, 'isSecureContext', {
                value: true,
                writable: false
            });
            
            console.log('WebAuthn API checks overridden');
        });
    }

    async addTestCredential(): Promise<void> {
        if (!this.authenticatorId || !this.client) {
            throw new Error('Authenticator not initialized.');
        }

        try {
            // Create a test credential to make the authenticator more attractive
            const credentialId = new Uint8Array(32);
            crypto.getRandomValues(credentialId);
            
            const userHandle = new Uint8Array(32);
            crypto.getRandomValues(userHandle);
            
            const privateKey = new Uint8Array(32);
            crypto.getRandomValues(privateKey);

            await this.client.send('WebAuthn.addCredential', {
                authenticatorId: this.authenticatorId,
                credential: {
                    credentialId: Array.from(credentialId),
                    userHandle: Array.from(userHandle),
                    privateKey: Array.from(privateKey),
                    signCount: 0,
                },
            });
            
            console.log('Test credential added to virtual authenticator');
        } catch (error) {
            console.log('Failed to add test credential:', error);
        }
    }

    async removeAuthenticator(): Promise<void> {
        if (!this.authenticatorId || !this.client) {
            return;
        }

        await this.client.send('WebAuthn.removeVirtualAuthenticator', {
            authenticatorId: this.authenticatorId,
        });

        this.authenticatorId = null;
    }
}
