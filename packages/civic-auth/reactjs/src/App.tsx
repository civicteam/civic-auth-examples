import { CivicAuthProvider, UserButton } from "@civic/auth/react";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const OAUTH_SERVER = import.meta.env.OAUTH_SERVER;
const App = () => {
  return (
      <CivicAuthProvider
        clientId={CLIENT_ID}
        config={{ oauthServer: OAUTH_SERVER }}
        nonce={'1234567890'}
      >
        <UserButton/>
      </CivicAuthProvider>
  );
}

export default App;
