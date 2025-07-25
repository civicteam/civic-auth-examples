"use client";
import { useUser } from "@civic/auth/react";
import { useCallback } from "react";

interface CustomSignInProps {
  user: any;
}

export default function CustomSignIn({ user }: CustomSignInProps) {
  const { signIn } = useUser();

  const doSignIn = useCallback(() => {
    console.log("[Pages Router] Starting sign-in process");
    signIn()
      .then(() => {
        console.log("[Pages Router] Sign in completed successfully");
      })
      .catch((error) => {
        console.error("[Pages Router] Sign in failed:", error);
      });
  }, [signIn]);

  return (
    <>
      {!user && (
        <button
          onClick={doSignIn}
          style={{
            width: "100%",
            display: "flex",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            borderRadius: "9999px",
            border: "1px solid #6b7280",
            padding: "0.75rem 1rem",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          Sign in (Custom - Pages Router)
        </button>
      )}
    </>
  );
}