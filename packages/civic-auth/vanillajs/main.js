import {
    CivicAuth,
    AuthenticationEvents,
    AuthEvent,
    BrowserCookieStorage,
    LocalStorageAdapter,
} from '@civic/auth/vanillajs';

// DOM Elements
const elements = {
    startAuthButton: document.getElementById('startAuthButton'),
    startAuthModalButton: document.getElementById('startAuthModalButton'),
    startNewTabButton: document.getElementById('startNewTabButton'),
    startRedirectButton: document.getElementById('startRedirectButton'),
    startBackendButton: document.getElementById('startBackendButton'),
    startBackendIframeButton: document.getElementById('startBackendIframeButton'),
    testCookiesButton: document.getElementById('testCookiesButton'),
    embeddedStatus: document.getElementById('embeddedStatus'),
    modalStatus: document.getElementById('modalStatus'),
    newTabStatus: document.getElementById('newTabStatus'),
    redirectStatus: document.getElementById('redirectStatus'),
    backendStatus: document.getElementById('backendStatus'),
    backendIframeStatus: document.getElementById('backendIframeStatus'),
    generalStatusText: document.getElementById('generalStatusText'),
    iframeContainer: document.getElementById('iframeContainer'),
    refreshTokensButton: document.getElementById('refreshTokensButton'),
    testRefreshRestoreButton: document.getElementById('testRefreshRestoreButton'),
    logoutButton: document.getElementById('logoutButton'),
    logoutEmbeddedButton: document.getElementById('logoutEmbeddedButton'),
    logoutModalButton: document.getElementById('logoutModalButton'),
    logoutNewTabButton: document.getElementById('logoutNewTabButton'),
    logoutRedirectButton: document.getElementById('logoutRedirectButton'),
    logoutBackendButton: document.getElementById('logoutBackendButton'),
    logoutBackendIframeButton: document.getElementById('logoutBackendIframeButton')
};

let events = new AuthenticationEvents();
const authClients = {}; // Store multiple auth clients for different flows

const VITE_LOGIN_URL = import.meta.env.VITE_LOGIN_URL ?? undefined;

// Status update helpers
const updateEmbeddedStatus = (message, type = 'ready') => {
    elements.embeddedStatus.textContent = `Embedded: ${message}`;
    elements.embeddedStatus.className = `status-item ${type}`;
};

const updateModalStatus = (message, type = 'ready') => {
    elements.modalStatus.textContent = `Modal: ${message}`;
    elements.modalStatus.className = `status-item ${type}`;
};

const updateNewTabStatus = (message, type = 'ready') => {
    elements.newTabStatus.textContent = `New Tab: ${message}`;
    elements.newTabStatus.className = `status-item ${type}`;
};

const updateRedirectStatus = (message, type = 'ready') => {
    elements.redirectStatus.textContent = `Redirect: ${message}`;
    elements.redirectStatus.className = `status-item ${type}`;
};

const updateBackendStatus = (message, type = 'ready') => {
    elements.backendStatus.textContent = `Backend: ${message}`;
    elements.backendStatus.className = `status-item ${type}`;
};

const updateBackendIframeStatus = (message, type = 'ready') => {
    console.log(`🔄 Updating Backend Iframe Status: "${message}" (${type})`);
    console.log('🔍 DOM element exists:', !!elements.backendIframeStatus);
    console.log('🔍 Current element text:', elements.backendIframeStatus?.textContent);
    
    if (elements.backendIframeStatus) {
        // Don't overwrite success states with checking/ready states
        const currentlySuccessful = elements.backendIframeStatus.classList.contains('success');
        const isDowngrade = currentlySuccessful && (type === 'processing' || type === 'ready');
        
        if (isDowngrade) {
            console.log('🛡️ Preventing downgrade from success state - keeping current status');
            return;
        }
        
        elements.backendIframeStatus.textContent = `Backend Iframe: ${message}`;
        elements.backendIframeStatus.className = `status-item ${type}`;
        console.log('✅ Status updated successfully');
    } else {
        console.error('❌ Backend iframe status element not found!');
    }
};

const updateGeneralStatus = (message, type = '') => {
    elements.generalStatusText.textContent = message;
    
    // Show logout button if any auth method shows authenticated
    const isAnyAuthenticated = 
        elements.embeddedStatus.classList.contains('success') ||
        elements.modalStatus.classList.contains('success') ||
        elements.newTabStatus.classList.contains('success') ||
        elements.redirectStatus.classList.contains('success') ||
        elements.backendStatus.classList.contains('success') ||
        elements.backendIframeStatus.classList.contains('success');
    
    elements.logoutButton.style.display = isAnyAuthenticated ? 'inline-block' : 'none';
};

// Create specific auth configurations for different flows
const createSpaConfig = (displayMode = 'iframe', skipPreload = false) => ({
    clientId: import.meta.env.VITE_CLIENT_ID || "demo-client-1",
    oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
    redirectUrl: window.location.origin + '/',
    displayMode: displayMode,
    events,
    nonce: "1234567890",
    logging: { enabled: true, level: "debug" },
    // Disable preloading during initialization to prevent hanging
    preloadIframe: skipPreload ? false : undefined,
    // For embedded mode, the ConfigProcessor automatically handles:
    // - iframeDisplayMode: 'embedded'
    // - preloadIframe: false (better for embedded visibility)
    // - All other iframe settings
    ...(displayMode === 'embedded' && { 
        targetContainerElement: elements.iframeContainer
        // Note: No need to manually set iframeDisplayMode or preloadIframe anymore!
    })
});

const createBackendConfig = (displayMode = 'redirect') => ({
    oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
    loginUrl: VITE_LOGIN_URL,
    clientId: import.meta.env.VITE_CLIENT_ID || "demo-client-1",
    displayMode: displayMode,
    events,
    nonce: "1234567890",
    logging: { enabled: false, level: "debug" },
    preloadIframe: true
});

const createBackendIframeConfig = () => ({
    oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
    loginUrl: VITE_LOGIN_URL,
    displayMode: 'iframe',
    events,
    nonce: "1234567890",
    logging: { enabled: false, level: "debug" },
    targetContainerElement: elements.iframeContainer
});

// A new, reliable helper to update UI for a specific mode
const updateStatusForMode = (mode, message, type) => {
    switch (mode) {
        case 'embedded': updateEmbeddedStatus(message, type); break;
        case 'modal': updateModalStatus(message, type); break;
        case 'new_tab': updateNewTabStatus(message, type); break;
        case 'redirect': updateRedirectStatus(message, type); break;
        case 'backend_redirect': updateBackendStatus(message, type); break;
        case 'backend_iframe': updateBackendIframeStatus(message, type); break;
        default:
          console.warn(`Unknown mode for status update: ${mode}`);
    }
};

// Check localStorage for active sessions without creating clients
const checkLocalStorageForActiveSession = () => {
    try {
        const tokens = {
            idToken: localStorage.getItem('id_token'),
            accessToken: localStorage.getItem('access_token'),
            refreshToken: localStorage.getItem('refresh_token'),
            userSession: localStorage.getItem('user_session')
        };
        
        const hasTokens = Object.values(tokens).some(token => token && token.trim() !== '');
        console.log('🔍 localStorage check:', {
            hasTokens,
            tokenCount: Object.values(tokens).filter(t => t).length
        });
        
        return hasTokens;
    } catch (error) {
        console.warn('❌ Error checking localStorage:', error);
        return false;
    }
};

// Clear invalid tokens from localStorage
const clearInvalidTokens = () => {
    try {
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_session');
        localStorage.removeItem('oidc_session_expires_at');
        console.log('🧹 Cleared invalid tokens from localStorage');
    } catch (error) {
        console.warn('❌ Error clearing tokens:', error);
    }
};

// Set all SPA modes to ready state
const setAllSpaModesToReady = () => {
    updateStatusForMode('embedded', 'Ready', 'ready');
    updateStatusForMode('modal', 'Ready', 'ready');
    updateStatusForMode('new_tab', 'Ready', 'ready');
    updateStatusForMode('redirect', 'Ready', 'ready');
};

const checkAuthenticationStatus = async (mode) => {
    // For backend flows, the source of truth is the server session, not local tokens.
    if (mode === 'backend_redirect' || mode === 'backend_iframe') {
        try {
            updateStatusForMode(mode, 'Checking...', 'processing');
            if (!VITE_LOGIN_URL) {
                updateStatusForMode(mode, 'Not configured', 'error');
                return false;
            }
            const backendUrl = new URL(VITE_LOGIN_URL).origin;
            // Use configured endpoints instead of hardcoded ones
            const config = (mode === 'backend_iframe') ? createBackendIframeConfig() : createBackendConfig('redirect');
            const userEndpoint = config.backendEndpoints?.user || '/auth/user';
            const response = await fetch(`${backendUrl}${userEndpoint}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log(`✅ Backend session found for ${mode}:`, userData);
                console.log(`🔍 Backend user object structure for ${mode}:`, {
                    name: userData.user?.name,
                    email: userData.user?.email,
                    sub: userData.user?.sub,
                    userObject: userData.user,
                    allUserProperties: Object.keys(userData.user || {}),
                    fullResponse: userData
                });
                
                // If session is active, create a client instance for logout purposes.
                const config = (mode === 'backend_iframe') ? createBackendIframeConfig() : createBackendConfig('redirect');
                const client = await CivicAuth.create(config);
                authClients[mode] = client; // Add to our list

                // Improved display logic with better fallbacks
                const displayName = userData.user?.name || userData.user?.email || userData.user?.sub || 'Authenticated';
                updateStatusForMode(mode, `✅ ${displayName}`, 'success');
                return true;
            }
        } catch (error) {
            console.warn(`Backend session check for ${mode} failed:`, error);
            updateStatusForMode(mode, 'Check failed', 'error');
            return false;
        }
        // If fetch fails or not ok, session is not active
        updateStatusForMode(mode, 'Ready', 'ready');
        return false;
    }

    // For SPA flows (embedded, modal, new_tab, redirect)
    let config;
    switch (mode) {
        case 'embedded': config = createSpaConfig('embedded'); break;
        case 'modal': config = createSpaConfig('iframe'); break;
        case 'new_tab': config = createSpaConfig('new_tab'); break;
        case 'redirect': config = createSpaConfig('redirect'); break;
        default: return false;
    }

    try {
        updateStatusForMode(mode, 'Checking...', 'processing');
        const client = await CivicAuth.create(config);
        const isAuthenticated = await client.isAuthenticated();
        
        if (isAuthenticated) {
            const user = await client.getCurrentUser();
            console.log(`✅ Already authenticated via ${mode}:`, user);
            console.log(`🔍 User object structure:`, {
                name: user?.name,
                email: user?.email,
                sub: user?.sub,
                allProperties: Object.keys(user || {})
            });
            
            authClients[mode] = client;
            
            // Improved display logic with better fallbacks
            const displayName = user?.name || user?.email || user?.sub || 'Authenticated';
            updateStatusForMode(mode, `✅ ${displayName}`, 'success');
            return true;
        }
        updateStatusForMode(mode, 'Ready', 'ready');

    } catch (error) {
        console.warn(`Could not check auth status for ${mode}:`, error);
        updateStatusForMode(mode, 'Check failed', 'error');
    }
    return false;
};

// Initialize authentication events and app
const initializeApp = async () => {
    // Handle the redirect from an OAuth flow
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') && urlParams.has('state')) {
        updateGeneralStatus('Processing authentication...', 'processing');
        try {
            const client = await CivicAuth.create(createSpaConfig('redirect', true)); // Skip preload for redirect handling
            await client.handleRedirect();
            const user = await client.getCurrentUser();
            updateGeneralStatus(`✅ Welcome, ${user?.name || user?.email}`);
            window.history.replaceState({}, document.title, "/");
        } catch (error) {
            console.error("Redirect handling failed", error);
            updateGeneralStatus(`❌ Authentication failed: ${error.message}`, 'error');
        }
    }

    updateGeneralStatus('Checking authentication status...');
    let anySessionActive = false;

    // Add timeout protection to prevent hanging
    const initTimeout = setTimeout(() => {
        console.warn('⚠️ Initialization timeout - forcing completion');
        updateGeneralStatus('Initialization timeout - some checks may have failed');
    }, 10000); // 10 second timeout

    // 1. First, check localStorage for any active sessions (fast, no client creation needed)
    console.log('🔍 Checking localStorage for active sessions...');
    const hasActiveSession = checkLocalStorageForActiveSession();
    
    if (hasActiveSession) {
        console.log('✅ Found tokens in localStorage - creating minimal client to verify session');
        try {
            // Create just one client to verify the session and get user info
            const verifyClient = await CivicAuth.create(createSpaConfig('new_tab', true)); // Skip preload
            const isAuthenticated = await verifyClient.isAuthenticated();
            
            if (isAuthenticated) {
                const user = await verifyClient.getCurrentUser();
                console.log('✅ Verified active SPA session:', user);
                console.log('🔍 SPA User object structure:', {
                    name: user?.name,
                    email: user?.email,
                    sub: user?.sub,
                    allProperties: Object.keys(user || {})
                });
                
                // Improved display logic with better fallbacks
                const displayName = user?.name || user?.email || user?.sub || 'Authenticated';
                const successMessage = `✅ ${displayName}`;
                
                // Update all SPA-based UIs since they share the same localStorage
                updateStatusForMode('embedded', successMessage, 'success');
                updateStatusForMode('modal', successMessage, 'success');
                updateStatusForMode('new_tab', successMessage, 'success');
                updateStatusForMode('redirect', successMessage, 'success');
                
                // Store the client for later use
                authClients['new_tab'] = verifyClient;
                anySessionActive = true;
            } else {
                console.log('❌ Tokens found but session invalid - clearing storage');
                clearInvalidTokens();
                setAllSpaModesToReady();
            }
        } catch (error) {
            console.error('❌ Error verifying session:', error);
            setAllSpaModesToReady();
        }
    } else {
        console.log('❌ No tokens found in localStorage');
        setAllSpaModesToReady();
    }

    // Initialize backend iframe client separately
    try {
        if (!authClients['backend_iframe']) {
            console.log('🚀 Creating backend iframe client');
            authClients['backend_iframe'] = await CivicAuth.create(createBackendIframeConfig());
        }
    } catch (error) {
        console.warn('⚠️ Could not initialize backend iframe client:', error);
    }

    // 2. Check for a backend session (cookie)
    try {
        console.log('🔍 Checking backend session...');
        const backendSessionActive = await checkAuthenticationStatus('backend_redirect');
        if (backendSessionActive) {
            anySessionActive = true;
            // Mirror the backend status for the iframe version since they share sessions
            const backendStatus = elements.backendStatus.textContent;
            updateStatusForMode('backend_iframe', backendStatus, 'success');
        } else {
            updateStatusForMode('backend_redirect', 'Ready', 'ready');
            updateStatusForMode('backend_iframe', 'Ready', 'ready');
        }
    } catch (error) {
        console.error('❌ Error checking backend session:', error);
        updateStatusForMode('backend_redirect', 'Check failed', 'error');
        updateStatusForMode('backend_iframe', 'Check failed', 'error');
    }

    // Clear the timeout since we completed successfully
    clearTimeout(initTimeout);

    // Finally, update the global status and logout button
    if (anySessionActive) {
        elements.logoutButton.style.display = 'inline-block';
        updateGeneralStatus('Active session(s) found. Ready.');
    } else {
        updateGeneralStatus('Ready. No active sessions found.');
    }

    console.log('✅ Initialization complete. Auth clients:', Object.keys(authClients));

    // Event Listeners (ensure this part remains)
    elements.startAuthButton.addEventListener('click', () => startAuth('embedded'));
    elements.startAuthModalButton.addEventListener('click', () => startAuth('modal'));
    elements.startNewTabButton.addEventListener('click', () => startAuth('new_tab'));
    elements.startRedirectButton.addEventListener('click', () => startAuth('redirect'));
    elements.startBackendButton.addEventListener('click', () => startAuth('backend_redirect'));
    elements.startBackendIframeButton.addEventListener('click', () => startAuth('backend_iframe'));
    elements.testCookiesButton.addEventListener('click', testBackendSession);

    // Add event listeners for token refresh
    events.on(AuthEvent.TOKEN_REFRESH_STARTED, () => {
      console.log('EVENT: TOKEN_REFRESH_STARTED');
      updateGeneralStatus('🔄 Refreshing session...', 'processing');
    });
    events.on(AuthEvent.TOKEN_REFRESH_COMPLETE, () => {
      console.log('EVENT: TOKEN_REFRESH_COMPLETE');
      updateGeneralStatus('✅ Session refreshed successfully!');
    });
    events.on(AuthEvent.TOKEN_REFRESH_ERROR, (error) => {
      console.error('EVENT: TOKEN_REFRESH_ERROR', error);
      updateGeneralStatus(`❌ Session refresh failed: ${error.message || error}`, 'error');
    });

    const debugButton = document.getElementById('debugCookiesButton');
    if (debugButton) {
        debugButton.addEventListener('click', debugCookies);
    }
    
    if (elements.refreshTokensButton) {
        elements.refreshTokensButton.addEventListener('click', async () => {
            console.log('🔄 Refreshing tokens...');
            try {
                const clientKey = Object.keys(authClients)[0];
                if (!clientKey) {
                    updateGeneralStatus('❌ No active client to refresh.', 'error');
                    throw new Error("No active client to refresh.");
                }

                const client = authClients[clientKey];
                const isBackendClient = client.getLoginUrl();

                if (isBackendClient) {
                    console.log(`🔄 Using backend client ('${clientKey}') for token refresh via API`);
                } else {
                    console.log(`🔄 Using SPA client ('${clientKey}') for token refresh`);
                }

                await client.refreshTokens();
                // The success/error status will be updated by the new event listeners
            } catch (error) {
                console.error("Token refresh failed", error);
                // The error status will be updated by the new event listeners
            }
        });
    }

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener('click', logoutAll);
    }
    elements.logoutEmbeddedButton.addEventListener('click', logoutEmbedded);
    elements.logoutModalButton.addEventListener('click', logoutModal);
    elements.logoutNewTabButton.addEventListener('click', logoutNewTab);
    elements.logoutRedirectButton.addEventListener('click', logoutRedirect);
    elements.logoutBackendButton.addEventListener('click', logoutBackend);
    elements.logoutBackendIframeButton.addEventListener('click', logoutBackendIframe);

    // Add event listener for refresh token restore test
    if (elements.testRefreshRestoreButton) {
        elements.testRefreshRestoreButton.addEventListener('click', testRefreshTokenRestore);
    }
};

// Start authentication process - each button creates its own independent auth client
const startAuth = async (mode) => {
    // Update the appropriate status based on mode
    const updateStatusForMode = (message, type) => {
        switch (mode) {
            case 'embedded':
                updateEmbeddedStatus(message, type);
                break;
            case 'modal':
                updateModalStatus(message, type);
                break;
            case 'new_tab':
                updateNewTabStatus(message, type);
                break;
            case 'redirect':
                updateRedirectStatus(message, type);
                break;
            case 'backend_redirect':
                updateBackendStatus(message, type);
                break;
            case 'backend_iframe':
                updateBackendIframeStatus(message, type);
                break;
        }
    };

    updateStatusForMode(`Starting...`, 'processing');
    updateGeneralStatus(`Starting ${mode} authentication...`);

    try {
        let client;

        // Reuse existing client if available (to preserve preloaded iframes), otherwise create new one
        if (authClients[mode]) {
            console.log(`🔄 Reusing existing ${mode} client (preserving preloaded iframe)`);
            client = authClients[mode];
        } else {
            console.log(`🚀 Creating new ${mode} client`);
            let config;

            switch (mode) {
                case 'embedded':
                    console.log('🚀 Starting embedded iframe authentication');
                    config = createSpaConfig('embedded', false); // Enable preloading for user-initiated auth
                    break;
                case 'modal':
                    console.log('🚀 Starting modal iframe authentication');
                    config = createSpaConfig('iframe', false); // Enable preloading for user-initiated auth
                    break;
                case 'new_tab':
                    console.log('🚀 Starting new tab authentication');
                    config = createSpaConfig('new_tab', false); // Enable preloading for user-initiated auth
                    break;
                case 'redirect':
                    console.log('🚀 Starting SPA redirect authentication');
                    config = createSpaConfig('redirect', false); // Enable preloading for user-initiated auth
                    break;
                case 'backend_redirect':
                    console.log('🚀 Starting backend redirect authentication');
                    config = createBackendConfig('redirect');
                    break;
                case 'backend_iframe':
                    console.log('🚀 Starting backend iframe authentication');
                    config = createBackendIframeConfig();
                    break;
                default:
                    throw new Error(`Unknown auth mode: ${mode}`);
            }

            console.log(`🔧 Config for ${mode}:`, config);
            
            // Create the auth client
            client = await CivicAuth.create(config);
            authClients[mode] = client;
        }

        // Check if already authenticated
        const isAuthenticated = await client.isAuthenticated();
        if (isAuthenticated) {
            const user = await client.getCurrentUser();
            console.log(`✅ Already authenticated via ${mode}:`, user);
            console.log(`🔍 User object structure for ${mode}:`, {
                name: user?.name,
                email: user?.email,
                sub: user?.sub,
                allProperties: Object.keys(user || {})
            });
            
            // Improved display logic with better fallbacks
            const displayName = user?.name || user?.email || user?.sub || 'Authenticated';
            updateStatusForMode(`✅ ${displayName}`, 'success');
            updateGeneralStatus(`Already authenticated via ${mode}`);
            return;
        }

        // Start authentication
        console.log(`🚀 Starting ${mode} authentication flow`);

        const {user, signalText} = await client.startAuthentication();
        console.log(`✅ ${mode} authentication successful:`, user, signalText);
        console.log(`🔍 New authentication user object structure for ${mode}:`, {
            name: user?.name,
            email: user?.email,
            sub: user?.sub,
            allProperties: Object.keys(user || {})
        });
        
        // Improved display logic with better fallbacks
        const displayName = user?.name || user?.email || user?.sub || 'Authenticated';
        updateStatusForMode(`✅ ${displayName}`, 'success');
        updateGeneralStatus(`${mode} authentication successful!`);
    } catch (error) {
        console.error(`❌ ${mode} authentication error:`, error);
        updateStatusForMode(`❌ Error: ${error.message}`, 'error');
        updateGeneralStatus(`${mode} authentication failed`);
    }
};

// Test backend session functionality via cookies
const testBackendSession = async () => {
    try {
        updateGeneralStatus('Testing backend session...');
        console.log('🧪 Testing backend session functionality via cookies');
        
        const backendUrl = new URL(VITE_LOGIN_URL).origin;
        console.log('🌐 Using backend URL:', backendUrl);

        const isAuthenticatedRedirect = await authClients['backend_redirect'].isAuthenticated();
        console.log('🔍 isAuthenticatedRedirect:', isAuthenticatedRedirect);

        const isAuthenticatedIframe = await authClients['backend_iframe'].isAuthenticated();
        console.log('🔍 isAuthenticatedIframe:', isAuthenticatedIframe);

        
        
        // Test if we can access backend user info (cookies will be sent automatically)
        // Use configured endpoints instead of hardcoded ones
        const config = createBackendConfig('redirect');
        const userEndpoint = config.backendEndpoints?.user || '/auth/user';
        const userApiUrl = `${backendUrl}${userEndpoint}`;
        console.log('🌐 Making request to', userApiUrl, 'with credentials: include');
        const response = await fetch(userApiUrl, {
            method: 'GET',
            credentials: 'include', // Include cookies in the request
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log('📡 Response status:', response.status, response.statusText);

        console.log('refreshing tokens...');
        await authClients['backend_redirect'].refreshTokens();
        console.log(' backend refreshed tokens');
        await authClients['backend_iframe'].refreshTokens();
        console.log(' iframe refreshed tokens');
        
        if (response.ok) {
            const userData = await response.json();
            console.log('🎉 Backend session active:', userData);
            updateGeneralStatus(`Backend session test: Active (${userData.user?.name || userData.user?.email || 'User'})`);
            // Also update the backend status
            updateBackendStatus(`✅ ${userData.user?.name || userData.user?.email || 'Authenticated'}`, 'success');
        } else if (response.status === 401) {
            console.log('🔒 No backend session found');
            updateGeneralStatus('Backend session test: No session found');
            updateBackendStatus('Ready', 'ready');
        } else {
            console.error('🔥 Backend request failed:', response.status, response.statusText);
            updateGeneralStatus(`Backend session test failed: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Backend session test failed:', error);
        updateGeneralStatus(`Backend session test failed: ${error.message}`);
    }
};

// Individual logout functions for each authentication method
const logoutEmbedded = async () => {
    try {
        console.log('🚪 Starting embedded logout');
        if (authClients['embedded']) {
            await authClients['embedded'].logout();
            authClients['embedded'].cleanup();
            delete authClients['embedded'];
            updateEmbeddedStatus('Ready', 'ready');
            updateGeneralStatus('Embedded logout completed');
        } else {
            console.log('No embedded client found');
            updateEmbeddedStatus('Ready', 'ready');
        }
    } catch (error) {
        console.error('❌ Embedded logout failed:', error);
        updateEmbeddedStatus('Logout failed', 'error');
    }
};

const logoutModal = async () => {
    try {
        console.log('🚪 Starting modal logout');
        if (authClients['modal']) {
            await authClients['modal'].logout();
            authClients['modal'].cleanup();
            delete authClients['modal'];
            updateModalStatus('Ready', 'ready');
            updateGeneralStatus('Modal logout completed');
        } else {
            console.log('No modal client found');
            updateModalStatus('Ready', 'ready');
        }
    } catch (error) {
        console.error('❌ Modal logout failed:', error);
        updateModalStatus('Logout failed', 'error');
    }
};

const logoutNewTab = async () => {
    try {
        console.log('🚪 Starting new tab logout');
        if (authClients['new_tab']) {
            await authClients['new_tab'].logout();
            authClients['new_tab'].cleanup();
            delete authClients['new_tab'];
            updateNewTabStatus('Ready', 'ready');
            updateGeneralStatus('New tab logout completed');
        } else {
            console.log('No new tab client found');
            updateNewTabStatus('Ready', 'ready');
        }
    } catch (error) {
        console.error('❌ New tab logout failed:', error);
        updateNewTabStatus('Logout failed', 'error');
    }
};

const logoutRedirect = async () => {
    try {
        console.log('🚪 Starting redirect logout');
        if (authClients['redirect']) {
            await authClients['redirect'].logout();
            authClients['redirect'].cleanup();
            delete authClients['redirect'];
            updateRedirectStatus('Ready', 'ready');
            updateGeneralStatus('Redirect logout completed');
        } else {
            console.log('No redirect client found');
            updateRedirectStatus('Ready', 'ready');
        }
    } catch (error) {
        console.error('❌ Redirect logout failed:', error);
        updateRedirectStatus('Logout failed', 'error');
    }
};

const logoutBackend = async () => {
    try {
        console.log('🚪 Starting backend logout');
        if (authClients['backend_redirect']) {
            await authClients['backend_redirect'].logout();
            authClients['backend_redirect'].cleanup();
            delete authClients['backend_redirect'];
            updateBackendStatus('Ready', 'ready');
            updateGeneralStatus('Backend logout completed');
        } else {
            console.log('No backend client found');
            updateBackendStatus('Ready', 'ready');
        }
    } catch (error) {
        console.error('❌ Backend logout failed:', error);
        updateBackendStatus('Logout failed', 'error');
    }
};

const logoutBackendIframe = async () => {
    try {
        console.log('🚪 Starting backend iframe logout');
        if (authClients['backend_iframe']) {
            await authClients['backend_iframe'].logout();
            authClients['backend_iframe'].cleanup();
            delete authClients['backend_iframe'];
            updateBackendIframeStatus('Ready', 'ready');
            updateGeneralStatus('Backend iframe logout completed');
        } else {
            console.log('No backend iframe client found');
            updateBackendIframeStatus('Ready', 'ready');
        }
    } catch (error) {
        console.error('❌ Backend iframe logout failed:', error);
        updateBackendIframeStatus('Logout failed', 'error');
    }
};

// A simpler, more direct "Logout All" function
const logoutAll = async () => {
    try {
        console.log('🚪 Starting logout all process');
        updateGeneralStatus('Logging out from all sessions...');

        const clientKeys = Object.keys(authClients);
        console.log('🔍 Found auth clients for logout:', clientKeys);

        // Find the most appropriate client to initiate logout.
        // Prioritize backend clients, as they handle the OIDC session logout which
        // effectively logs out SPA sessions as well.
        const primaryClientKey = clientKeys.find(key => key.startsWith('backend')) || clientKeys[0];
        console.log('🔍 Primary client key:', primaryClientKey);
        if (!primaryClientKey) {
            console.warn('🟡 Logout All clicked, but no active auth client was found. Resetting UI.');
            initializeApp(); // Force a UI reset to a clean state.
            return;
        }
        

        console.log(`🚪 Using client '${primaryClientKey}' to log out.`);

        for await (const clientKey of clientKeys) {
            const client = authClients[clientKey];
            const isAuthenticated = await client.isAuthenticated();
            console.log(`🔍 Logout All: Checking client '${clientKey}' for logout. isAuthenticated: ${isAuthenticated}`)
            console.log(`🔍 Logout All: Current object: ${clientKey}`, client.storage);
            if (isAuthenticated) {
                console.log(`🚪 Logging out client '${clientKey}'.`);
                await client.logout();
                client.cleanup();

                // We break on first successful logout.
                break;
            }
        }

        initializeApp();

    } catch (error) {
        console.error('❌ Logout all failed:', error);
        updateGeneralStatus(`❌ Logout failed: ${error.message}`);
    }
};

// Debug cookies functionality
const debugCookies = async () => {
    try {
        updateGeneralStatus('Debugging cookies...');
        console.log('🔍 Debug: Checking cookie state');
        
        // Show frontend cookies
        console.log('🍪 Frontend document.cookie:', document.cookie || '(empty)');
        
        // Test BrowserCookieStorage specifically
        try {
            const cookieStorage = new BrowserCookieStorage();
            const cookieTokens = {
                idToken: await cookieStorage.get('id_token'),
                accessToken: await cookieStorage.get('access_token'),
                refreshToken: await cookieStorage.get('refresh_token'),
                userSession: await cookieStorage.get('user_session')
            };
            console.log('🍪 BrowserCookieStorage tokens:', {
                idToken: cookieTokens.idToken ? `${cookieTokens.idToken.substring(0, 20)}...` : 'not found',
                accessToken: cookieTokens.accessToken ? `${cookieTokens.accessToken.substring(0, 20)}...` : 'not found',
                refreshToken: cookieTokens.refreshToken ? `${cookieTokens.refreshToken.substring(0, 20)}...` : 'not found',
                userSession: cookieTokens.userSession ? `${cookieTokens.userSession.substring(0, 50)}...` : 'not found'
            });
            
            const cookieTokenCount = Object.values(cookieTokens).filter(v => v).length;
            console.log(`🍪 Found ${cookieTokenCount}/4 tokens in cookies`);
            
            if (cookieTokenCount === 0 && VITE_LOGIN_URL) {
                console.warn('⚠️ No tokens found in cookies. This suggests:');
                console.warn('   1. Backend cookies are set with httpOnly: true (invisible to JavaScript)');
                console.warn('   2. Backend cookies have restrictive sameSite settings');
                console.warn('   3. Cross-origin cookie access is blocked');
                console.warn('💡 Check your backend cookie configuration!');
            }
        } catch (cookieError) {
            console.error('❌ BrowserCookieStorage test failed:', cookieError);
        }
        
        // Check localStorage tokens
        try {
            const localStorage = window.localStorage;
            const tokens = {
                idToken: localStorage.getItem('id_token'),
                accessToken: localStorage.getItem('access_token'),
                refreshToken: localStorage.getItem('refresh_token'),
                codeVerifier: localStorage.getItem('code_verifier'), // PKCE code verifier
                userSession: localStorage.getItem('user_session')
            };
            console.log('💾 localStorage tokens:', {
                idToken: tokens.idToken ? `${tokens.idToken.substring(0, 20)}...` : 'not found',
                accessToken: tokens.accessToken ? `${tokens.accessToken.substring(0, 20)}...` : 'not found',
                refreshToken: tokens.refreshToken ? `${tokens.refreshToken.substring(0, 20)}...` : 'not found',
                codeVerifier: tokens.codeVerifier ? `${tokens.codeVerifier.substring(0, 20)}...` : 'not found',
                userSession: tokens.userSession ? `${tokens.userSession.substring(0, 50)}...` : 'not found'
            });
            
            // Show all localStorage keys for complete debugging
            console.log('🗂️ All localStorage keys:', Object.keys(localStorage));
            
            const tokenCount = Object.values(tokens).filter(v => v).length;
            updateGeneralStatus(`Debug complete: ${tokenCount}/5 localStorage items found - check console for details`);
        } catch (storageError) {
            console.error('❌ localStorage access failed:', storageError);
            updateGeneralStatus('Debug failed: localStorage access denied');
        }
    } catch (error) {
        console.error('❌ Cookie debug failed:', error);
        updateGeneralStatus(`Debug failed: ${error.message}`);
    }
};

// Test automatic refresh behavior with only refresh token
const testRefreshTokenRestore = async () => {
    try {
        updateGeneralStatus('Testing refresh token restore...');
        console.log('🧪 Testing automatic session restore with only refresh_token');
        
        // First check if we have any authentication
        const hasAnyAuth = Object.values(authClients).some(async (client) => {
            try {
                return await client.isAuthenticated();
            } catch {
                return false;
            }
        });
        
        if (!hasAnyAuth) {
            updateGeneralStatus('❌ No authenticated session found. Please authenticate first.');
            return;
        }
        
        // Get current refresh token before clearing
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            updateGeneralStatus('❌ No refresh token found. Please authenticate with offline_access scope.');
            return;
        }
        
        console.log('🔑 Found refresh token, proceeding with test');
        
        // Clear all tokens except refresh_token
        console.log('🧹 Clearing all tokens except refresh_token...');
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('oidc_session_expires_at');
        localStorage.removeItem('user_session');
        
        // Keep the refresh token
        console.log('🔑 Keeping refresh_token for restoration test');
        
        // Create a new client to test authentication with only refresh token
        console.log('🚀 Creating new client to test automatic refresh...');
        const testClient = await CivicAuth.create(createSpaConfig('new_tab'));
        
        // This should now automatically attempt refresh since only refresh_token exists
        console.log('🔍 Checking authentication (should trigger automatic refresh)...');
        const isAuthenticated = await testClient.isAuthenticated();
        
        if (isAuthenticated) {
            const user = await testClient.getCurrentUser();
            console.log('✅ Session successfully restored via refresh token!', user);
            updateGeneralStatus(`✅ Refresh token restore successful! Welcome back, ${user?.name || user?.email}`);
            
            // Update UI to reflect restored session
            await initializeApp();
        } else {
            console.log('❌ Session restoration failed');
            updateGeneralStatus('❌ Refresh token restore failed - token may be expired');
        }
        
    } catch (error) {
        console.error('❌ Refresh token restore test failed:', error);
        updateGeneralStatus(`❌ Refresh token restore test failed: ${error.message}`);
    }
};

// Start the application
initializeApp(); 