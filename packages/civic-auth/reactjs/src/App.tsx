import { CivicAuthProvider, UserButton } from "@civic/auth/react";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;

function App() {
  return (
    <CivicAuthProvider 
      clientId={CLIENT_ID}
      // oauthServer is not necessary for production.
      config={{ oauthServer: AUTH_SERVER || 'https://auth.civic.com/oauth'}}
    >
      <UserButton />
    </CivicAuthProvider>
  )
}

export default App;


