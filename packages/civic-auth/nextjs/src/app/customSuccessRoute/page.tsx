import { getUser } from "@civic/auth/nextjs";
import {UserButton } from "@civic/auth/react";

export default async function Home() {
    const user = await getUser();
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <h1 data-testid="loginSuccessUrlHeader">My custom success route</h1>
        <h1>Hello, {user?.name}</h1>

        <UserButton />
    </div>
  );
}
