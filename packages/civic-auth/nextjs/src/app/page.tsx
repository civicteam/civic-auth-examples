import { getUser } from '@civic/auth/nextjs';
import { UserButton } from "@civic/auth/react";

export default async function Home() {
  const user = await getUser();
  return (
      <main>
          {user && (
            <div>Hello {user.email}</div>
          ) }
          <UserButton />
      </main>
  );
}
