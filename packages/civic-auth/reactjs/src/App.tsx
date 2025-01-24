import { CivicAuthProvider, UserButton } from "@civic/auth/react";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const App = () => {
  return (
      <CivicAuthProvider
        clientId={CLIENT_ID}
        config={{ oauthServer: 'https://auth-dev.civic.com/oauth/' }}
        nonce={'1234567890'}
      >
        <UserButton/>
      </CivicAuthProvider>
  );
}

export default App;
