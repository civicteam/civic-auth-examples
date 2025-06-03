import { CivicAuth, AuthenticationEvents, AuthEvent } from '@civic/auth/vanillajs';

let authClient;
let events;

// UI Helper functions
const showUserInfo = (user) => {
    console.log("showUserInfo", user);

    const userInfoDiv = document.getElementById('userInfo');
    const userNameSpan = document.getElementById('userName');
    
    userNameSpan.textContent = user.name || user.email || 'User';
    userInfoDiv.classList.add('show');
};

const hideUserInfo = () => {
    const userInfoDiv = document.getElementById('userInfo');
    userInfoDiv.classList.remove('show');
};

// Initialize auth client
const initializeAuth = async () => {
    try {
        // Set up events for logout functionality
        events = new AuthenticationEvents();
        events.on(AuthEvent.SIGN_OUT_COMPLETE, () => {
            console.log("Logout completed");
            hideUserInfo();
        });
        events.on(AuthEvent.SIGN_OUT_ERROR, (error) => {
            console.error("Logout failed:", error);
        });

        authClient = await CivicAuth.create({
            clientId: import.meta.env.VITE_CLIENT_ID || "demo-client-1",
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
            events: events,
        });
        
        // Check if user is already authenticated
        const isAuthenticated = await authClient.isAuthenticated();
        if (isAuthenticated) {
            const { user } = await authClient.getCurrentUser();
            showUserInfo({user});
            console.log("User already authenticated:", user);
        }
    } catch (error) {
        console.error("Failed to initialize auth:", error);
    }
};

// Sign in with embedded iframe
document.getElementById("loginButton").addEventListener("click", async () => {
    try {
        // Reinitialize with embedded mode
        authClient = await CivicAuth.create({
            clientId: import.meta.env.VITE_CLIENT_ID || "demo-client-1",
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
            targetContainerElement: document.getElementById("authContainer"),
            iframeDisplayMode: "embedded",
            events: events,
        });
        
        const { user } = await authClient.startAuthentication();
        showUserInfo(user);
        console.log("Authentication successful:", user);
    } catch (error) {
        console.error("Authentication failed:", error);
    }
});

// Sign in with modal
document.getElementById("loginModalButton").addEventListener("click", async () => {
    try {
        // Reinitialize with modal mode
        authClient = await CivicAuth.create({
            clientId: import.meta.env.VITE_CLIENT_ID || "demo-client-1",
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
            events: events,
        });
        
        const { user } = await authClient.startAuthentication();
        showUserInfo(user);
        console.log("Authentication successful:", user);
    } catch (error) {
        console.error("Authentication failed:", error);
    }
});

// Sign out
document.getElementById("logoutButton").addEventListener("click", async () => {
    try {
        await authClient?.logout();
        console.log("Logged out successfully");
    } catch (error) {
        console.error("Logout failed:", error);
    }
});

// Initialize on page load
initializeAuth(); 