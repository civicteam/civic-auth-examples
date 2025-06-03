import * as AuthSession from "expo-auth-session";

export interface CivicAuthConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  endSessionEndpoint: string;
  redirectUri: string;
  scopes: string[];
}

if (!process.env.EXPO_PUBLIC_CLIENTID) {
  throw new Error("Missing EXPO_PUBLIC_CLIENTID environment variable");
}
if (!process.env.EXPO_PUBLIC_APP_SCHEME) {
  throw new Error("Missing EXPO_PUBLIC_APP_SCHEME environment variable");
}
if (!process.env.EXPO_PUBLIC_CIVIC_AUTH_URL) {
  throw new Error("Missing EXPO_PUBLIC_CIVIC_AUTH_URL environment variable");
}

export const civicAuthConfig: CivicAuthConfig = {
  clientId: process.env.EXPO_PUBLIC_CLIENTID,
  authorizationEndpoint: process.env.EXPO_PUBLIC_CIVIC_AUTH_URL + "/auth",
  tokenEndpoint: process.env.EXPO_PUBLIC_CIVIC_AUTH_URL + "/token",
  userInfoEndpoint: process.env.EXPO_PUBLIC_CIVIC_AUTH_URL + "/userinfo",
  endSessionEndpoint: process.env.EXPO_PUBLIC_CIVIC_AUTH_URL + "/session/end",

  // Redirect URI for this app
  redirectUri: AuthSession.makeRedirectUri({
    scheme: process.env.EXPO_PUBLIC_APP_SCHEME,
  }),

  // OAuth2 scopes to request
  scopes: ["openid", "profile", "email"],
};

// Validation function to check if configuration is complete
export const validateConfig = (config: CivicAuthConfig): boolean => {
  const requiredFields: (keyof CivicAuthConfig)[] = [
    "clientId",
    "authorizationEndpoint",
    "tokenEndpoint",
    "redirectUri",
  ];

  return requiredFields.every((field) => {
    const value = config[field];
    return value && !value.includes("placeholder");
  });
};

// Helper to log configuration status
export const logConfigStatus = () => {
  const config = civicAuthConfig;
  const isValid = validateConfig(config);

  console.log("🔧 Civic Auth Configuration Status:");
  console.log(`   Valid: ${isValid ? "✅" : "❌"}`);
  console.log(
    `   Client ID: ${config.clientId === "your-civic-client-id" ? "❌ Not set" : "✅ Set"}`,
  );
  console.log(`   Authorization Endpoint: ${config.authorizationEndpoint}`);
  console.log(`   Token Endpoint: ${config.tokenEndpoint}`);
  console.log(`   Redirect URI: ${config.redirectUri}`);
  console.log(`   Scopes: ${config.scopes.join(", ")}`);

  if (!isValid) {
    console.log(
      "\n⚠️  Please update config/civicAuth.ts with your actual Civic Auth credentials",
    );
  }
};
