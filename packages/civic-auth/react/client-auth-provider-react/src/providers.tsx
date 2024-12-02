'use client';

import { type Config } from '@civic/auth';

import { ReactNode } from 'react';
import { CivicAuthProvider } from '@civic/auth/react';

// Create a client
const clientId = 'demo-client-1';
const nonce = '1234567890';
const stages = ['local', 'dev', 'prod'] as const;

type Stage = (typeof stages)[number];

const stageConfig: Record<Stage, Config> = {
  local: {
    oauthServer: 'http://localhost:3001/',
  },
  dev: {
    oauthServer: 'https://auth-dev.civic.com/oauth/',
  },
  prod: {
    oauthServer: 'https://auth.civic.com/oauth/',
  },
};

const envStage = import.meta.env.STAGE as Stage | undefined;

// TODO: We should have this selectable in the UI
const defaultStage: Stage = envStage ?? (stages.find((st) => st === 'dev') as Stage);

const Providers = ({ children }: { children: ReactNode }) => {
  const stage = defaultStage;

  return (
    <CivicAuthProvider clientId={clientId} config={stageConfig[stage] as Config} nonce={nonce}>
      {children}
    </CivicAuthProvider>
  );
};

export { Providers };
