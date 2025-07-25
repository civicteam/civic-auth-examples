import { GetServerSideProps } from 'next'
import { CivicAuth, CookieStorage } from "@civic/auth/server";
import { useUser } from "@civic/auth/react";
import CustomSignIn from "../components/CustomSignIn";

interface HomeProps {
  serverUser: any; // User data from server-side
}

// NextJS-specific CookieStorage implementation
class NextJSCookieStorage extends CookieStorage {
  constructor(
    private req: any,
    private res: any
  ) {
    super({
      secure: process.env.NODE_ENV === "production",
    });
  }

  async get(key: string): Promise<string | null> {
    return this.req.cookies[key] || null;
  }

  async set(key: string, value: string): Promise<void> {
    // In getServerSideProps, we can't set cookies directly
    // This would typically be handled in API routes
    console.log(`Would set cookie: ${key}=${value}`);
  }

  async clear(): Promise<void> {
    // In getServerSideProps, we can't clear cookies directly
    // This would typically be handled in API routes
    console.log('Would clear all cookies');
  }

  async delete(key: string): Promise<void> {
    // In getServerSideProps, we can't delete cookies directly
    // This would typically be handled in API routes
    console.log(`Would delete cookie: ${key}`);
  }
}

export default function Home({ serverUser }: HomeProps) {
  // Focus on server-side auth - no client-side fallback
  const user = serverUser;

  return (
    <main>
      {user && (
        <div>
          Hello {user.email} (from server)
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "300px",
          margin: "30px auto",
        }}
      >
        <h1>Civic Auth (NextJS Pages Router)</h1>
        <div>
          {user ? (
            <div>
              <p>Signed in as: {user.email}</p>
              <button onClick={() => window.location.href = '/api/auth/logout'}>
                Sign out
              </button>
            </div>
          ) : (
            <p>Not signed in</p>
          )}
        </div>
        <CustomSignIn user={user} />
      </div>
    </main>
  );
}

// Use server-side CivicAuth class from @civic/auth/server following "any backend" approach
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Create NextJS-specific storage implementation
    const storage = new NextJSCookieStorage(context.req, context.res);

    // Create auth config based on Express example
    const authConfig = {
      clientId: process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID!,
      redirectUrl: `http://localhost:3001/api/auth/callback`,
      postLogoutRedirectUrl: `http://localhost:3001/`,
      // oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
    };

    // Create CivicAuth instance
    const civicAuth = new CivicAuth(storage, authConfig);
    
    // Debug: Log cookies to see what's available
    console.log('Available cookies:', Object.keys(context.req.cookies));
    console.log('Cookie values:', context.req.cookies);
    
    // Get the user using the CivicAuth class method
    const user = await civicAuth.getUser();
    console.log('Server-side user result:', user);
    
    return {
      props: {
        serverUser: user
      }
    };
  } catch (error) {
    console.error('Server-side user fetch failed:', error);
    return {
      props: {
        serverUser: null
      }
    };
  }
}