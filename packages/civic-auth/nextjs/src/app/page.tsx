"use client";

import { UserButton } from "@civic/auth/react";
import CustomSignIn from "../Components/CustomSignIn";
import { useUser } from "@civic/auth/react";

export default function Home() {
  const { user } = useUser();

  return (
    <main>
      {user && <div>Hello {user.email}</div>}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "300px",
          margin: "30px auto",
        }}
      >
        <h1>Civic Auth (NextJS)</h1>
        <UserButton />
        <CustomSignIn />
      </div>
    </main>
  );
}
