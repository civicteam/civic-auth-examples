import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AuthGuard } from "@/components/AuthGuard";
import { SolanaActions } from "@/components/SolanaActions";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

function AuthenticatedContent() {
  const { state, signOut } = useContext(AuthContext);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome back, {state.user?.name}!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">🎉 Authentication Successful</ThemedText>
        <ThemedText>You are now authenticated with Civic Auth!</ThemedText>
        {state.user?.name && (
          <ThemedText>
            Hello,{" "}
            <ThemedText type="defaultSemiBold">{state.user.name}</ThemedText>!
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">User Status</ThemedText>
        <ThemedText>
          <ThemedText type="defaultSemiBold">Logged in as:</ThemedText>{" "}
          {state.user?.name || "Loading"}
        </ThemedText>
      </ThemedView>

      <SolanaActions />

      <ThemedView style={styles.buttonContainer}>
        <ThemedView style={styles.signOutButton} onTouchEnd={signOut}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

export default function HomeScreen() {
  return (
    <AuthGuard>
      <AuthenticatedContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  signOutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signOutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
