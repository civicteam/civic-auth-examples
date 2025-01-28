import { CivicAuthProvider, UserButton } from "@civic/auth/react";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const VITE_OAUTH_SERVER = import.meta.env.VITE_OAUTH_SERVER;
const App = () => {
  return (
      <CivicAuthProvider
        clientId={CLIENT_ID}
        config={{ oauthServer: VITE_OAUTH_SERVER || 'https://auth-dev.civic.com/oauth', }}
        nonce={'1234567890'}
      >
        <UserButton/>
      </CivicAuthProvider>
  );
}

export default App;
