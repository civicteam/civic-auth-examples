import { useState } from "react";
import { CivicAuthProvider, UserButton } from "@civic/auth/react";
import OnSignInTestComponent from "./components/OnSignInTestComponent";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;

function OnSignInTestApp() {
  const [callbackLog, setCallbackLog] = useState<string[]>([]);
  const [callbackCount, setCallbackCount] = useState(0);

  const handleOnSignIn = (options: { error?: Error; user?: unknown; session?: unknown }) => {
    const timestamp = new Date().toISOString();
    const logEntry = options.error 
      ? `[${timestamp}] onSignIn called with ERROR: ${options.error.message}`
      : `[${timestamp}] onSignIn called with SUCCESS (no error)`;
    
    setCallbackLog(prev => [...prev, logEntry]);
    setCallbackCount(prev => prev + 1);
    
    // Also log to console for debugging
    console.log('onSignIn callback executed:', { options, timestamp });
  };

  const clearLog = () => {
    setCallbackLog([]);
    setCallbackCount(0);
  };

  return (
    <CivicAuthProvider
      clientId={CLIENT_ID}
      config={{ oauthServer: AUTH_SERVER || "https://auth.civic.com/oauth" }}
      onSignIn={handleOnSignIn}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "800px",
          margin: "30px auto",
          padding: "0 1rem"
        }}
      >
        <h1>Civic Auth - OnSignIn Callback Test (ReactJS)</h1>
        
        <div style={{ 
          border: '2px solid #007bff', 
          padding: '1rem', 
          borderRadius: '8px',
          backgroundColor: '#f0f8ff'
        }}>
          <h2>Provider-Level onSignIn Callback</h2>
          <p><strong>Callback Count:</strong> {callbackCount}</p>
          
          <button 
            onClick={clearLog}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            Clear Callback Log
          </button>

          <div>
            <strong>Provider onSignIn Log:</strong>
            <div style={{ 
              backgroundColor: '#fff', 
              border: '1px solid #ddd', 
              padding: '0.5rem', 
              marginTop: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}>
              {callbackLog.length === 0 ? (
                <div style={{ color: '#666', fontStyle: 'italic' }}>No provider callbacks logged yet</div>
              ) : (
                callbackLog.map((log, index) => (
                  <div key={index} style={{ 
                    marginBottom: '0.25rem',
                    color: log.includes('ERROR') ? '#dc3545' : '#28a745'
                  }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <OnSignInTestComponent />
        
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '4px'
        }}>
          <h3>Test Instructions:</h3>
          <ol>
              <li>Click &quot;Sign in&quot; to test successful sign-in callback</li>
            <li>Try multiple sign-in attempts to verify callback is called each time</li>
            <li>Check both the provider-level log and component-level log</li>
            <li>Verify that onSignIn is called after each sign-in attempt</li>
            <li>Test logout and sign-in again to verify callback behavior</li>
          </ol>
        </div>
      </div>
    </CivicAuthProvider>
  );
}

export default OnSignInTestApp;