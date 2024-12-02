import { DisplayMode, ForwardedTokens } from '@civic/auth';
import { useAuth, UserButton, useToken, useUser } from '@civic/auth/react';
import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const App = () => {
  const { isAuthenticated } = useAuth();
  const { accessToken, idToken, forwardedTokens } = useToken();
  const { user } = useUser();

  const [authRedirectMode, setAuthRedirectMode] = useState<DisplayMode>('iframe');

  return (
    <main className="flex min-h-screen flex-grow flex-col bg-neutral-100">
      <div className="flex min-h-screen flex-col justify-center bg-neutral-100 py-6 sm:py-12">
        <div className="relative py-3 sm:mx-auto sm:max-w-3xl">
          <div className="to-light-blue-500 absolute inset-0 -skew-y-6 transform bg-gradient-to-r from-cyan-400 shadow-lg sm:-rotate-6 sm:skew-y-0 sm:rounded-3xl"></div>
          <div className="relative flex flex-col gap-8 bg-white px-4 py-10 shadow-lg sm:rounded-3xl sm:p-20">
            {isAuthenticated ? (
              <UserInfo
                user={{ email: user?.email || '' }}
                accessToken={accessToken || ''}
                idToken={idToken || ''}
                forwardedTokens={forwardedTokens}
              />
            ) : (
              <SignInForm
                authRedirectMode={authRedirectMode}
                setAuthRedirectMode={(mode: string) => setAuthRedirectMode(mode as DisplayMode)}
              />
            )}

            <UserButton displayMode={authRedirectMode} />
          </div>
        </div>
      </div>
    </main>
  );
};

const UserInfo = ({
  user,
  accessToken,
  idToken,
  forwardedTokens,
}: {
  user: { email: string | null };
  accessToken: string | null;
  idToken: string | null;
  forwardedTokens: ForwardedTokens;
}) => {
  return (
    <div className="space-y-6">
      <p className="text-xl text-neutral-700">
        Welcome, <span className="font-semibold">{user.email}</span>
      </p>
      {accessToken ? <TokenInfo title="Access Token" token={accessToken} /> : null}
      {idToken ? <TokenInfo title="ID Token" token={idToken} /> : null}
      {forwardedTokens && (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-neutral-900">Forwarded Tokens</h2>
          <pre className="overflow-x-auto rounded-lg bg-neutral-100 p-4" data-testid="forwardedTokensField">
            {JSON.stringify(forwardedTokens, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const TokenInfo = ({ title, token }: { title: string; token: string }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
      <pre className="overflow-x-auto rounded-lg bg-neutral-100 p-4" data-testid="tokenField">
        {JSON.stringify(token, null, 2)}
      </pre>
      <pre className="overflow-x-auto rounded-lg bg-neutral-100 p-4" data-testid="userDataField">
        {JSON.stringify(jwtDecode(token as string), null, 2)}
      </pre>
    </div>
  );
};

const SignInForm = ({
  authRedirectMode,
  setAuthRedirectMode,
}: {
  authRedirectMode: DisplayMode;
  setAuthRedirectMode: (mode: string) => void;
}) => {
  return (
    <div className="flex w-80 flex-col gap-8">
      <h2 className="text-xl font-bold text-neutral-900">Select a Display Mode</h2>

      <div className="flex flex-col gap-2">
        <RadioButton
          id="new_tab"
          value="new_tab"
          label="New tab or popup"
          checked={authRedirectMode === 'new_tab'}
          onChange={setAuthRedirectMode}
          testId="radio-mode-popup"
        />
        <RadioButton
          id="iframe"
          testId="radio-mode-iframe"
          value="iframe"
          label="Iframe"
          checked={authRedirectMode === 'iframe'}
          onChange={setAuthRedirectMode}
        />
        <RadioButton
          id="redirect"
          value="redirect"
          label="Redirect"
          checked={authRedirectMode === 'redirect'}
          onChange={setAuthRedirectMode}
          testId="radio-mode-redirect"
        />
      </div>
    </div>
  );
};

const RadioButton = ({
  id,
  value,
  label,
  checked,
  onChange,
  testId,
}: {
  id: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
  testId: string;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        id={id}
        type="radio"
        name="mode"
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.value as DisplayMode)}
        className="form-radio text-indigo-500"
        data-testid={testId}
      />
      <label htmlFor={id} className="text-neutral-700">
        {label}
      </label>
    </div>
  );
};

export default App;
