import { getUser } from "@civic/auth/nextjs";
import { UserButton } from "@civic/auth/react";
import CustomSignIn from "../Components/CustomSignIn";

export default async function Home() {
  const user = await getUser();

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
