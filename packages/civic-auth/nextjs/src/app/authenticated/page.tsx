import { getTokens, getUser } from "@civic/auth/nextjs";
import { UserButton } from "@civic/auth/react";

// this page should only be accessible to authenticated users
export default async function AuthenticatedPage() {
    const user = await getUser();
    const tokens = await getTokens() ?? {};

    return (
        <div>
        <h1>Authenticated Page</h1>
        <p>This page is only accessible to authenticated users.</p>
        <p>User ID: {user?.id}</p>
        <p>User Name: {user?.name}</p>
        <p>User Email: {user?.email}</p>
        <p>Access Token: {tokens?.accessToken}</p>
        <p>Refresh Token: {tokens?.idToken}</p>
        <UserButton />
        </div>
    );
}
