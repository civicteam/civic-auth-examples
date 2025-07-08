import { CivicAuth, AuthenticationEvents, AuthEvent } from '@civic/auth/vanillajs';

let authClient;
let events;

// Helper function to ensure URL ends with trailing slash

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
            // Auth server is not required for production
            loginUrl: "http://localhost:3020/auth/login",
            events: events,
            displayMode: "iframe",
            logging: {
                level: "debug",
                enabled: true,
            },
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
        });
        
        // Check if user is already authenticated
        const isAuthenticated = await authClient.isAuthenticated();
        if (isAuthenticated) {
            const user = await authClient.getCurrentUser();
            showUserInfo(user);
            console.log("User already authenticated:", user);
        }
    } catch (error) {
        console.error("Failed to initialize auth:", error);
    }
};

// Sign in with embedded iframe
document.getElementById("loginRedirectButton").addEventListener("click", async () => {
    try {
        // Reinitialize with embedded mode
        authClient = await CivicAuth.create({
            loginUrl: "http://localhost:3020/auth/login",
            displayMode: "redirect",
            events: events,
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
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
            loginUrl: "http://localhost:3020/auth/login",
            events: events,
            displayMode: "iframe",
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
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