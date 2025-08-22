import { createContext, useEffect, useMemo, useReducer } from "react";
import { AuthRequestConfig, useAuthRequest } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { civicAuthConfig } from "@/config/civicAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWeb3Client, type Web3Client } from "@civic/react-native-auth-web3";

// Create a query client (required by wagmi)
const queryClient = new QueryClient();

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

export type AuthContextType = {
  state: AuthState;
  signIn?: () => Promise<void>;
  signOut?: () => Promise<void>;
  web3Client?: Web3Client | null;
};

export const AuthContext = createContext<AuthContextType>({
  state: initialState,
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
  // Add error boundary logging
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.("publicKey")) {
        console.log("=== PublicKey Error Debug ===");
        console.log("Error:", args[0]);
        console.trace("Stack trace for publicKey error");
      }
      originalConsoleError.apply(console, args);
    };
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
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

  const web3Client = useWeb3Client(
    {
      endpoints: {
        wallet: "https://dev.api.civic.com/metakeep-dev",
      },
    },
    undefined,
    authState.idToken,
  );

  const authContext = useMemo(
    () => ({
      state: authState,
      web3Client,
      signIn: async () => {
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

          const result = await WebBrowser.openAuthSessionAsync(
            endSessionUrl.toString(),
            finalConfig.redirectUri,
          );

          // Only sign out if the session was completed successfully
          // If the user cancels (result.type === 'cancel'), we don't sign them out
          if (result.type === "success") {
            dispatch({ type: "SIGN_OUT" });
          }
        } catch (e) {
          console.warn(e);
        }
      },
    }),
    [authState, promptAsync, finalConfig, web3Client],
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
      // web3User.createWallet();
      if (!web3Client?.ethereum || !web3Client.solana) {
        web3Client?.createWallets();
      }
      getUserInfo();
    }
  }, [
    authState.accessToken,
    authState.isAuthenticated,
    dispatch,
    finalConfig.userInfoEndpoint,
    web3Client,
  ]);

  useEffect(() => {}, [authState.isAuthenticated, authState.user]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authContext}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};
