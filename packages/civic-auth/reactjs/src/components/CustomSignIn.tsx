import { useUser } from "@civic/auth/react";
import { useCallback } from "react";

export default function CustomSignIn() {
  const { signIn, user } = useUser();

  const doSignIn = useCallback(() => {
    console.log("[Page] Starting sign-in process");
    signIn()
      .then(() => {
        console.log("[Page] Sign in completed successfully");
      })
      .catch((error) => {
        console.error("[Page] Sign in failed:", error);
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
          data-testid="sign-in-standalone-custom-button"
        >
          Sign in (Custom)
        </button>
      )}
    </>
  );
}
