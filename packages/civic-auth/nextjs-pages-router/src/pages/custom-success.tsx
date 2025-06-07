import { GetServerSidePropsContext } from 'next';
import { getUser } from '@civic/auth/nextjs';
import { NextApiRequest } from 'next';
import Link from 'next/link';

type SuccessPageProps = {
  user: any;
};

export default function CustomSuccessPage({ user }: SuccessPageProps) {
  return (
    <main>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '600px',
          margin: '30px auto',
        }}
      >
        <h1>Custom Success Page</h1>
        {user ? (
          <div>
            <p>You are logged in as: {user.email}</p>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
        <Link href="/">Back to Home</Link>
      </div>
    </main>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const req = context.req as NextApiRequest;
  const user = await getUser({ req });

  return {
    props: {
      user: user || null,
    },
  };
}
