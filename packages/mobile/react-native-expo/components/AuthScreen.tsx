import React, { useContext } from "react";
import { StyleSheet, Alert } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { AuthContext } from "@/contexts/AuthContext";

interface AuthButtonProps {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function AuthButton({ onPress, disabled = false, children }: AuthButtonProps) {
  return (
    <ThemedView
      style={[styles.button, disabled && styles.buttonDisabled]}
      onTouchEnd={disabled ? undefined : onPress}
    >
      <ThemedText
        style={[styles.buttonText, disabled && styles.buttonTextDisabled]}
      >
        {children}
      </ThemedText>
    </ThemedView>
  );
}

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { state, signIn, signOut } = useContext(AuthContext);

  const handleSignIn = async () => {
    try {
      signIn();
      onAuthSuccess?.();
    } catch (error) {
      Alert.alert(
        "Authentication Error",
        "Failed to sign in with Civic Auth. Please try again.",
        [{ text: "OK" }],
      );
    }
  };

  const handleSignOut = async () => {
    try {
      signOut();
    } catch (error) {
      Alert.alert("Sign Out Error", "Failed to sign out. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  if (state.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (state.isAuthenticated && state.user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.userInfo}>
          <ThemedText style={styles.welcomeText}>Welcome!</ThemedText>
          <ThemedText style={styles.userText}>
            {state.user.name || state.user.email || "Authenticated User"}
          </ThemedText>
          {state.user.email && (
            <ThemedText style={styles.emailText}>{state.user.email}</ThemedText>
          )}
        </ThemedView>

        <AuthButton onPress={handleSignOut}>Sign Out</AuthButton>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>Civic Auth</ThemedText>
        <ThemedText style={styles.subtitle}>
          This example app showcases how to authenticate with Civic Auth
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <AuthButton onPress={handleSignIn} disabled={state.isLoading}>
          {state.isLoading ? "Connecting..." : "Sign in with Civic"}
        </AuthButton>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: "center",
    opacity: 0.8,
  },
  features: {
    alignItems: "flex-start",
  },
  featureText: {
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.9,
  },
  buttonContainer: {
    alignItems: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonTextDisabled: {
    color: "#666",
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  userText: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
