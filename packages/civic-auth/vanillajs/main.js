import { CivicAuth } from '@civic/auth/vanillajs';

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

// Check if user is already authenticated on page load
const checkAuthStatus = async () => {
    try {
        const authClient = await CivicAuth.create({
            clientId: import.meta.env.VITE_CLIENT_ID || "demo-client-1",
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
        });
        
        const isAuthenticated = await authClient.isAuthenticated();
        if (isAuthenticated) {
            const { user } = await authClient.getCurrentUser();
            showUserInfo({user});
            console.log("User already authenticated:", user);
        }
    } catch (error) {
        console.error("Failed to check auth status:", error);
    }
};

// Sign in with embedded iframe
document.getElementById("loginButton").addEventListener("click", async () => {
    try {
        const authClient = await CivicAuth.create({
            clientId: import.meta.env.VITE_CLIENT_ID || "demo-client-1",
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
            targetContainerElement: document.getElementById("authContainer"),
            iframeDisplayMode: "embedded",
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
        const authClient = await CivicAuth.create({
            clientId: import.meta.env.VITE_CLIENT_ID || "demo-client-1",
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
            displayMode: "modal"
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
        const authClient = await CivicAuth.create({
            clientId: import.meta.env.VITE_CLIENT_ID || "demo-client-1",
            oauthServerBaseUrl: import.meta.env.VITE_AUTH_SERVER ?? undefined,
        });
        
        await authClient.logout();
        hideUserInfo();
        console.log("Logged out successfully");
    } catch (error) {
        console.error("Logout failed:", error);
    }
});

// Check authentication status on page load
checkAuthStatus(); 