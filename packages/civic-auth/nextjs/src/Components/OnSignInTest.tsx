"use client";
import { CivicAuthProvider, UserButton } from "@civic/auth/react";
import CustomSignIn from "./CustomSignIn";

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
const AUTH_SERVER = process.env.NEXT_PUBLIC_AUTH_SERVER;

export default function OnSignInTest() {
  const handleSignIn = (error?: Error) => {
    if (error) {
      console.log('onSignIn callback - Error:', error.message);
    } else {
      console.log('onSignIn callback - Success: User signed in successfully');
    }
  };

  return (
    <CivicAuthProvider
      clientId={CLIENT_ID}
      onSignIn={handleSignIn}
      // oauthServer is not necessary for production.
      config={{ oauthServer: AUTH_SERVER || "https://auth.civic.com/oauth" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "300px",
          margin: "30px auto",
        }}
      >
        <h1>Civic Auth (NextJS) - onSignIn Test</h1>
        <UserButton />
        <CustomSignIn />
      </div>
    </CivicAuthProvider>
  );
}
