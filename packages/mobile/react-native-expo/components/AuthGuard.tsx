import React, { useContext } from "react";
import { AuthScreen } from "./AuthScreen";
import { AuthContext } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { state } = useContext(AuthContext);

  if (state.isLoading) {
    return fallback || <AuthScreen />;
  }

  if (!state.isAuthenticated) {
    return fallback || <AuthScreen />;
  }

  return <>{children}</>;
}
