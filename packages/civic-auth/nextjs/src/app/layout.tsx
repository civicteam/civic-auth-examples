import { CivicAuthProvider } from "@civic/auth/nextjs";

function Layout({ children }) {
  return (
    <CivicAuthProvider>
      {children}
    </CivicAuthProvider>
    ...
  )
}