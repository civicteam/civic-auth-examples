import { UserButton } from "@civic/auth/react";

// this page should only be accessible to authenticated users
export default async function UnAuthenticatedPage() {

    return (
        <div>
        <h1>UnAuthenticated Page</h1>
        <p>This page can be accessed by all users.</p>
        <UserButton />
        </div>
    );
}
