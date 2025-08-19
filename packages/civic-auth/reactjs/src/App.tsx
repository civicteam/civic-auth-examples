import { CivicAuthProvider, UserButton } from "@civic/auth/react";
import CustomSignIn from "./components/CustomSignIn";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;

function App() {
  return (
    <CivicAuthProvider
      clientId={CLIENT_ID}
      // oauthServer is not necessary for production.
      config={{ oauthServer: AUTH_SERVER || "https://auth.civic.com/oauth" }}
      displayMode="iframe"
      iframeMode="embedded"
      targetContainerElement="civic-auth-iframe-container"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "300px",
          margin: "30px auto",
        }}
      >
        <h1>Civic Auth (ReactJS)</h1>
        <UserButton />
        <CustomSignIn />
        <div id="civic-auth-iframe-container" />
      </div>
    </CivicAuthProvider>
  );
}

export default App;
