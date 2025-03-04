import { CivicAuthProvider, UserButton } from "@civic/auth/react";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;
const App = () => {
  return (
      <CivicAuthProvider
        clientId={CLIENT_ID}
        config={{ oauthServer: AUTH_SERVER }}
      >
        <UserButton/>
      </CivicAuthProvider>
  );
}

export default App;
