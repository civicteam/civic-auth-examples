import { CivicAuthProvider, UserButton } from "@civic/auth/react";

const App = () => {
  return (
      <CivicAuthProvider
        clientId={"YOUR CLIENT ID"}
        modalIframe={false}
      >
        <UserButton displayMode="redirect"/>
      </CivicAuthProvider>
  );
}

export default App;