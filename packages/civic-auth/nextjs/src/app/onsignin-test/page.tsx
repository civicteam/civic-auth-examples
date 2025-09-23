import { getUser } from "@civic/auth/nextjs";
import OnSignInTest from "../Components/OnSignInTest";

export default async function OnSignInTestPage() {
  const user = await getUser();

  return (
    <main>
      {user && <div>Hello {user.email}</div>}
      <OnSignInTest />
    </main>
  );
}
