"use client";
import { useState, useEffect } from "react";
import { useUser } from "@civic/auth/react";

interface OnSignInTestComponentProps {
  onSignInCallback?: (error?: Error) => void;
}

export default function OnSignInTestComponent({ onSignInCallback }: OnSignInTestComponentProps) {
  // Use the recommended Next.js approach: pass onSignIn to useUser hook
  const { signIn, user, authStatus, signOut } = useUser({
    onSignIn: (options: { error?: Error; user?: unknown; session?: unknown }) => {
      const timestamp = new Date().toISOString();
      const logEntry = options.error 
        ? `[${timestamp}] useUser onSignIn called with ERROR: ${options.error.message}`
        : `[${timestamp}] useUser onSignIn called with SUCCESS (no error)`;
      
      setCallbackLog(prev => [...prev, logEntry]);
      
      // Also call the optional prop callback for backward compatibility
      if (onSignInCallback) {
        onSignInCallback(options.error);
      }
    }
  });
  const [callbackLog, setCallbackLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add effect to log auth status changes
  useEffect(() => {
    const timestamp = new Date().toISOString();
    setCallbackLog(prev => [...prev, `[${timestamp}] Auth status changed to: ${authStatus}`]);
  }, [authStatus]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setCallbackLog(prev => [...prev, `[${new Date().toISOString()}] Starting sign-in attempt`]);
    
    try {
      await signIn();
      setCallbackLog(prev => [...prev, `[${new Date().toISOString()}] Sign-in completed successfully`]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCallbackLog(prev => [...prev, `[${new Date().toISOString()}] Sign-in failed: ${errorMessage}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setCallbackLog(prev => [...prev, `[${new Date().toISOString()}] Starting sign-out attempt`]);
    
    try {
      await signOut();
      setCallbackLog(prev => [...prev, `[${new Date().toISOString()}] Sign-out completed successfully`]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setCallbackLog(prev => [...prev, `[${new Date().toISOString()}] Sign-out failed: ${errorMessage}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLog = () => {
    setCallbackLog([]);
  };

  return (
    <div style={{ 
      border: '1px solid #ccc', 
      padding: '1rem', 
      margin: '1rem 0',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>OnSignIn Callback Test Component</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={handleSignIn}
          disabled={isLoading || authStatus === 'authenticated'}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: authStatus === 'authenticated' ? '#4CAF50' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: authStatus === 'authenticated' ? 'not-allowed' : 'pointer',
            marginRight: '0.5rem'
          }}
        >
          {isLoading ? 'Signing in...' : authStatus === 'authenticated' ? 'Already signed in' : 'Test Sign In'}
        </button>
        
        <button 
          onClick={handleSignOut}
          disabled={isLoading || authStatus !== 'authenticated'}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: authStatus === 'authenticated' ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: authStatus === 'authenticated' ? 'pointer' : 'not-allowed',
            marginRight: '0.5rem'
          }}
        >
          {isLoading ? 'Signing out...' : 'Test Sign Out'}
        </button>
        
        <button 
          onClick={clearLog}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Log
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>User Status:</strong> {user ? `Logged in as ${user.name || user.email}` : 'Not logged in'}
        <br />
        <strong>Auth Status:</strong> {authStatus}
      </div>

      <div>
        <strong>Callback Log:</strong>
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
            <div style={{ color: '#666', fontStyle: 'italic' }}>No callbacks logged yet</div>
          ) : (
            callbackLog.map((log, index) => (
              <div key={index} style={{ marginBottom: '0.25rem' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {onSignInCallback && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          backgroundColor: '#e7f3ff', 
          border: '1px solid #b3d9ff',
          borderRadius: '4px'
        }}>
          <strong>Note:</strong> onSignIn callback is configured at provider level
        </div>
      )}
    </div>
  );
}
