import { getUser } from '@civic/auth/nextjs';
import { UserButton } from "@civic/auth/react";
import {redirect} from "next/navigation";

export default async function Home() {
  const user = await getUser();

    // If logged in, redirect to chat page
    if (user) {
        console.log("User is logged in!", user)
        redirect('/authenticated');
    }

  return (
      <main>
          <UserButton />
      </main>
  );
}
