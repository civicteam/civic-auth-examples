import { CivicAuthProvider, UserButton } from "@civic/auth/react";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const App = () => {
  return (
      <CivicAuthProvider
        clientId={CLIENT_ID}
      >
        <UserButton/>
      </CivicAuthProvider>
  );
}

export default App;
