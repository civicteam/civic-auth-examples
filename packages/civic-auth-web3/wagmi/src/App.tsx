import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider,
  createConfig,
  useAccount,
  useConnect,
  http,
  useBalance,
} from 'wagmi';
import { userHasWallet } from '@civic/auth-web3';
import { embeddedWallet } from '@civic/auth-web3/wagmi';
import { CivicAuthProvider, UserButton, useUser } from '@civic/auth-web3/react';
import { mainnet, sepolia } from "wagmi/chains";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
if (!CLIENT_ID) throw new Error('CLIENT_ID is required');
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;
const WALLET_API_BASE_URL = import.meta.env.VITE_WALLET_API_BASE_URL;
const wagmiConfig = createConfig({
  chains: [ mainnet, sepolia ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    embeddedWallet(),
  ],
});

// Wagmi requires react-query
const queryClient = new QueryClient();

// Wrap the content with the necessary providers to give access to hooks: react-query, wagmi & civic auth provider
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig as any}>
      <CivicAuthProvider 
          clientId={CLIENT_ID} 
          // oauthServer and wallet are not necessary for production.
          config={{ oauthServer: AUTH_SERVER || 'https://auth.civic.com/oauth'}}
          endpoints={{ wallet: WALLET_API_BASE_URL }}
          >
          <AppContent />
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

// Separate component for the app content that needs access to hooks
const AppContent = () => {
  const userContext = useUser();
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const balance = useBalance({
    address: userHasWallet(userContext)
      ? userContext.ethereum.address as `0x${string}` : undefined,
  });

  // A function to connect an existing civic embedded wallet
  const connectExistingWallet = () => { 
    return connect({
      connector: connectors?.[0],
    });
  };

  // A function that creates the wallet if the user doesn't have one already
  const createWallet = () => {
    if (userContext.user && !userHasWallet(userContext)) {
      // Once the wallet is created, we can connect it straight away
      return userContext.createWallet().then(connectExistingWallet);
    }
  };

  return (
    <>
      <UserButton />
      {userContext.user &&
        <div>
          {!userHasWallet(userContext) &&
            <p><button onClick={createWallet}>Create Wallet</button></p>
          }
          {userHasWallet(userContext) &&
            <>
              <p>Wallet address: {userContext.ethereum.address}</p>
              <p>Balance: {
                balance?.data
                  ? `${(BigInt(balance.data.value) / BigInt(1e18)).toString()} ${balance.data.symbol}`
                  : 'Loading...'
              }</p>
              {isConnected ? <p>Wallet is connected</p> : (
                <button onClick={connectExistingWallet}>Connect Wallet</button>
              )}
            </>
          }
        </div>
      }
    </>
  );
};

export default App;
