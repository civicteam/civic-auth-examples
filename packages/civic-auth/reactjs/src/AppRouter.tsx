import { useState, useEffect } from 'react';
import App from './App';
import OnSignInTest from './OnSignInTest';

function AppRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Add navigation for testing
  const Navigation = () => (
    <nav style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '10px', 
      zIndex: 1000,
      background: 'white',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '5px'
    }}>
      <button 
        onClick={() => navigate('/')} 
        style={{ marginRight: '10px', padding: '5px 10px' }}
      >
        Home
      </button>
      <button 
        onClick={() => navigate('/onsignin-test')} 
        style={{ padding: '5px 10px' }}
      >
        onSignIn Test
      </button>
    </nav>
  );

  return (
    <>
      <Navigation />
      {currentPath === '/onsignin-test' ? <OnSignInTest /> : <App />}
    </>
  );
}

export default AppRouter;
