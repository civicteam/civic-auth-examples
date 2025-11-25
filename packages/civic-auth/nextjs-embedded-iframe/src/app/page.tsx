import { getUser } from "@civic/auth/nextjs";
import { UserButton } from "@civic/auth/react";
import EmbeddedIframeLogin from "./EmbeddedIframeLogin";

export default async function Page() {
  const user = await getUser();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div style={{ width: "100%", maxWidth: "28rem", padding: "1rem" }}>
        {user ? (
          <div
            data-testid="logged-in-content"
            style={{
              borderRadius: "0.5rem",
              backgroundColor: "white",
              padding: "2rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h1 style={{ marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "bold" }}>
              Welcome!
            </h1>
            <p data-testid="user-email" style={{ marginBottom: "1.5rem", color: "#4b5563" }}>
              Logged in as: <span style={{ fontWeight: "600" }}>{user.email}</span>
            </p>
            <UserButton />
          </div>
        ) : (
          <EmbeddedIframeLogin />
        )}
      </div>
    </div>
  );
}
