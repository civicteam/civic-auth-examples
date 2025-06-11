import { GetServerSidePropsContext } from 'next';
import { UserButton } from '@civic/auth/react';
import { getUser } from '@civic/auth/nextjs';
import CustomSignIn from '@/components/CustomSignIn';
import { NextApiRequest } from 'next';

type HomeProps = {
  user: any;
};

export default function Home({ user }: HomeProps) {
  return (
    <main>
      {user && <div>Hello {user.email}</div>}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '300px',
          margin: '30px auto',
        }}
      >
        <h1>Civic Auth (NextJS Pages Router)</h1>
        <UserButton />
        <CustomSignIn />
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
