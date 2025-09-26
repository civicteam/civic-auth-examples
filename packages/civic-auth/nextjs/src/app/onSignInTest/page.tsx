"use client";
import { CivicAuthProvider, UserButton } from "@civic/auth/react";
import OnSignInTestComponent from "../../Components/OnSignInTestComponent";

const CLIENT_ID = process.env.CLIENT_ID
const AUTH_SERVER = process.env.AUTH_SERVER

export default function OnSignInTestPage() {

  return (
    <CivicAuthProvider
      clientId={CLIENT_ID}
      config={{ oauthServer: AUTH_SERVER }}
    >
      <main>
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
          <h1>Civic Auth - OnSignIn Callback Test (NextJS)</h1>
          
          <div style={{ 
            border: '2px solid #28a745', 
            padding: '1rem', 
            borderRadius: '8px',
            backgroundColor: '#f0fff0'
          }}>
            <h2>Next.js onSignIn Implementation</h2>
            <p><strong>Approach:</strong> Using <code>useUser</code> hook with <code>onSignIn</code> callback</p>
            <p style={{ fontSize: '0.9em', color: '#666' }}>
              Note: Provider-level <code>onSignIn</code> is not supported in Next.js due to SSR constraints.
              The recommended approach is to pass <code>onSignIn</code> to the <code>useUser</code> hook.
            </p>
          </div>

          <UserButton />
          
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
              <li>Click &quot;Test Sign In&quot; to test the useUser onSignIn callback</li>
              <li>Try multiple sign-in attempts to verify callback is called each time</li>
              <li>Check the component-level log for useUser callback events</li>
              <li>Verify that onSignIn is called after each sign-in attempt</li>
              <li>Test logout and sign-in again to verify callback behavior</li>
            </ol>
          </div>
        </div>
      </main>
    </CivicAuthProvider>
  );
}
