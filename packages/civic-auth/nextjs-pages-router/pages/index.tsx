import { GetServerSideProps } from 'next'
import { useUser } from "@civic/auth/react";
import CustomSignIn from "../components/CustomSignIn";

// For Pages Router, we can't use the App Router getUser() function directly
// This is where we need to implement server-side auth checking manually
// following the "any backend" approach

interface HomeProps {
  // We might not be able to get user data server-side easily
  // This is a potential gap we're exploring
}

export default function Home(props: HomeProps) {
  // Use client-side user hook instead
  const { user } = useUser();

  return (
    <main>
      {user && <div>Hello {user.email}</div>}
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
        <CustomSignIn />
      </div>
    </main>
  );
}

// For now, we'll skip server-side rendering of user data
// This is a gap we're identifying - Pages Router might not have
// easy access to server-side user data like App Router does
export const getServerSideProps: GetServerSideProps = async (context) => {
  // TODO: Implement server-side user fetching if needed
  // This would require manually parsing cookies/sessions
  // following the "any backend" approach
  
  return {
    props: {}
  }
}