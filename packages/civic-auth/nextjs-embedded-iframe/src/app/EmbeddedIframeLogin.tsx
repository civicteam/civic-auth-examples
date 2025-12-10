"use client";

import { CivicAuthIframeContainer } from "@civic/auth/react";

export default function EmbeddedIframeLogin() {
  return (
    <div
      data-testid="embedded-iframe-container"
      style={{
        borderRadius: "0.5rem",
        backgroundColor: "white",
        padding: "2rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h1
        style={{
          marginBottom: "1.5rem",
          textAlign: "center",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        Embedded Iframe Login
      </h1>
      <CivicAuthIframeContainer />
    </div>
  );
}

