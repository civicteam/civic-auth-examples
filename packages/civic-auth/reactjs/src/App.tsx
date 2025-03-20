import { CivicAuthProvider, UserButton } from "@civic/auth/react";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTH_SERVER = import.meta.env.AUTH_SERVER;
// const PORT = import.meta.env.PORT ? parseInt(import.meta.env.PORT) : 3000;

function App() {
  return (
    <CivicAuthProvider 
      clientId={CLIENT_ID}
      config={{ oauthServer: AUTH_SERVER }}
      redirectUrl='http://localhost:3000/api/auth/callback'
    >
      <UserButton />
    </CivicAuthProvider>
  )
}

export default App;


