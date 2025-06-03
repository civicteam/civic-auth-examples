import React, { createContext, useEffect, useMemo, useReducer } from "react";
import { AuthRequestConfig, useAuthRequest } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { civicAuthConfig } from "@/config/civicAuth";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}

interface AuthUser {
  email?: string;
  name: string;
  picture?: string;
  sub: string;
}

interface AuthAction {
  type: string;
  payload?: any;
}

const initialState: AuthState = {
  isLoading: false,
  isAuthenticated: false,
};

export const AuthContext = createContext({
  state: initialState,
  signIn: () => {},
  signOut: () => {},
});

// This is needed to close the webview after a complete login
WebBrowser.maybeCompleteAuthSession();

export const AuthProvider = ({
  config,
  children,
}: {
  config?: Partial<AuthRequestConfig>;
  children: React.ReactNode;
}) => {
  const finalConfig = useMemo(() => {
    return { ...civicAuthConfig, ...config };
  }, [config]);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: finalConfig.clientId,
      scopes: finalConfig.scopes,
      redirectUri: finalConfig.redirectUri,
      usePKCE: true,
    },
    {
      authorizationEndpoint: finalConfig.authorizationEndpoint,
      tokenEndpoint: finalConfig.tokenEndpoint,
    },
  );

  const [authState, dispatch] = useReducer(
    (previousState: AuthState, action: AuthAction): AuthState => {
      console.debug(action.type, action.payload);
      switch (action.type) {
        case "SIGN_IN":
          return {
            ...previousState,
            isAuthenticated: true,
            accessToken: action.payload.access_token,
            idToken: action.payload.id_token,
            expiresIn: action.payload.expires_in,
          };
        case "USER_INFO":
          return {
            ...previousState,
            user: action.payload,
          };
        case "SIGN_OUT":
          return initialState;
        default:
          return previousState;
      }
    },
    initialState,
  );

  const authContext = useMemo(
    () => ({
      state: authState,
      signIn: () => {
        promptAsync();
      },
      signOut: async () => {
        if (!authState.idToken) {
          throw new Error("No idToken found");
        }
        try {
          const endSessionUrl = new URL(finalConfig.endSessionEndpoint);
          endSessionUrl.searchParams.append("client_id", finalConfig.clientId);
          endSessionUrl.searchParams.append("id_token_hint", authState.idToken);
          endSessionUrl.searchParams.append(
            "post_logout_redirect_uri",
            finalConfig.redirectUri,
          );

          await WebBrowser.openAuthSessionAsync(
            endSessionUrl.toString(),
            finalConfig.redirectUri,
          );
          dispatch({ type: "SIGN_OUT" });
        } catch (e) {
          console.warn(e);
        }
      },
    }),
    [authState, promptAsync, finalConfig],
  );

  useEffect(() => {
    const getToken = async ({
      code,
      codeVerifier,
      redirectUri,
    }: {
      code: string;
      redirectUri: string;
      codeVerifier?: string;
    }) => {
      try {
        const response = await fetch(finalConfig.tokenEndpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: finalConfig.clientId,
            code,
            code_verifier: codeVerifier || "",
            redirect_uri: redirectUri,
          }).toString(),
        });
        if (response.ok) {
          const payload = await response.json();
          dispatch({ type: "SIGN_IN", payload });
        }
      } catch (e) {
        console.warn(e);
      }
    };
    if (response?.type === "success") {
      const { code } = response.params;
      getToken({
        code,
        codeVerifier: request?.codeVerifier,
        redirectUri: finalConfig.redirectUri || "",
      });
    } else if (response?.type === "error") {
      console.warn("Authentication error: ", response.error);
    }
  }, [dispatch, finalConfig, request?.codeVerifier, response]);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const accessToken = authState.accessToken;
        const response = await fetch(finalConfig.userInfoEndpoint || "", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const payload = await response.json();
          dispatch({ type: "USER_INFO", payload });
        }
      } catch (e) {
        console.warn(e);
      }
    };
    if (authState.isAuthenticated) {
      getUserInfo();
    }
  }, [
    authState.accessToken,
    authState.isAuthenticated,
    dispatch,
    finalConfig.userInfoEndpoint,
  ]);

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
};
