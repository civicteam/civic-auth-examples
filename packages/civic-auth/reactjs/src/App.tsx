import { CivicAuthProvider, UserButton } from "@civic/auth/react";
import CustomSignIn from "./components/CustomSignIn";
import OnSignInTestApp from "./OnSignInTestApp";
import { useState } from "react";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;

function App() {
  // Check URL for onSignInTest parameter
  const urlParams = new URLSearchParams(window.location.search);
  const initialView = urlParams.get('view') === 'onSignInTest' ? 'onSignInTest' : 'main';
  const [currentView, setCurrentView] = useState<'main' | 'onSignInTest'>(initialView);

  if (currentView === 'onSignInTest') {
    return <OnSignInTestApp />;
  }

  return (
    <CivicAuthProvider
      clientId={CLIENT_ID}
      // oauthServer is not necessary for production.
      config={{ oauthServer: AUTH_SERVER || "https://auth.civic.com/oauth" }}
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
        
        <button 
          onClick={() => setCurrentView('onSignInTest')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Test onSignIn Callback
        </button>
      </div>
    </CivicAuthProvider>
  );
}

export default App;