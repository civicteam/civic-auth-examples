import { useEffect, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getEnvironmentConfig,
  logConfigStatus,
  type CivicAuthConfig,
} from "../config/civicAuth";

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthResponse {
  type: string;
  params: {
    code?: string;
    error?: string;
    state?: string;
  };
  url?: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: "civic_auth_access_token",
  REFRESH_TOKEN: "civic_auth_refresh_token",
  USER_DATA: "civic_auth_user_data",
} as const;

export function useCivicAuth(config: Partial<CivicAuthConfig> = {}) {
  const finalConfig = { ...getEnvironmentConfig(), ...config };

  // Log configuration status in development
  useEffect(() => {
    if (__DEV__) {
      logConfigStatus();
    }
  }, []);

  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: finalConfig.clientId,
      scopes: finalConfig.scopes,
      redirectUri: finalConfig.redirectUri,
      // responseType: AuthSession.ResponseType.Code,
      // codeChallenge: await Crypto.digestStringAsync(
      //   Crypto.CryptoDigestAlgorithm.SHA256,
      //   'test', // This should be dynamically generated
      //   { encoding: Crypto.CryptoEncoding.BASE64 }
      // ),
      // codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      // state: Crypto.getRandomBytes(16).toString(),
    },
    {
      authorizationEndpoint: finalConfig.authorizationEndpoint,
      tokenEndpoint: finalConfig.tokenEndpoint,
    },
  );

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuthData();
  }, []);

  // Handle auth response
  useEffect(() => {
    if (response?.type === "success") {
      console.log("Response", response);
      handleAuthSuccess(response);
    } else if (response?.type === "error") {
      console.error("Auth error:", response.params.error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [response]);

  const loadStoredAuthData = async () => {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && userData) {
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: JSON.parse(userData),
          accessToken,
          refreshToken,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Error loading stored auth data:", error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleAuthSuccess = async (authResponse: AuthResponse) => {
    try {
      if (!authResponse.params.code) {
        throw new Error("No authorization code received");
      }

      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // Exchange authorization code for tokens
      const tokenResponse = await exchangeCodeForTokens(
        authResponse.params.code,
      );

      if (tokenResponse.access_token) {
        // Fetch user info if endpoint is available
        const user = finalConfig.userInfoEndpoint
          ? await fetchUserInfo(tokenResponse.access_token)
          : { id: "user-id" }; // Placeholder user object

        // Store tokens and user data
        await Promise.all([
          AsyncStorage.setItem(
            STORAGE_KEYS.ACCESS_TOKEN,
            tokenResponse.access_token,
          ),
          AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
          tokenResponse.refresh_token &&
            AsyncStorage.setItem(
              STORAGE_KEYS.REFRESH_TOKEN,
              tokenResponse.refresh_token,
            ),
        ]);

        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || null,
        });
      }
    } catch (error) {
      console.error("Error handling auth success:", error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const exchangeCodeForTokens = async (code: string) => {
    const response = await fetch(finalConfig.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: finalConfig.clientId,
        code,
        redirect_uri: finalConfig.redirectUri,
        code_verifier: "test", // This should match the challenge
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  };

  const fetchUserInfo = async (accessToken: string) => {
    if (!finalConfig.userInfoEndpoint) {
      throw new Error("User info endpoint not configured");
    }

    const response = await fetch(finalConfig.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }

    return response.json();
  };

  const signIn = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("Error during sign in:", error);
    }
  };

  const signOut = async () => {
    try {
      // Clear stored data
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);

      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      });
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const refreshAccessToken = async () => {
    if (!authState.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await fetch(finalConfig.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: finalConfig.clientId,
          refresh_token: authState.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();

      await AsyncStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN,
        tokenData.access_token,
      );

      if (tokenData.refresh_token) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          tokenData.refresh_token,
        );
      }

      setAuthState((prev) => ({
        ...prev,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || prev.refreshToken,
      }));

      return tokenData.access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      await signOut(); // Sign out on refresh failure
      throw error;
    }
  };

  return {
    ...authState,
    signIn,
    signOut,
    refreshAccessToken,
    config: finalConfig,
  };
}
