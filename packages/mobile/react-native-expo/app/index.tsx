import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AuthGuard } from "@/components/AuthGuard";
import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";

function AuthenticatedContent() {
  const { state, signOut, web3Client } = useContext(AuthContext);

  const [signature, setSignature] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<string | null>(null);

  const sendTransaction = async () => {
    try {
      if (web3Client) {
        const transaction = await web3Client?.solana?.sendTransaction(
          "AK531DxnLT5SkL6BBAY52Db7xw2NcEVabXt6aUVmiBGX",
          0.01,
        );
        setTransaction(transaction);
        console.log("Transaction:", transaction);
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };

  const signMessage = async () => {
    try {
      if (web3Client) {
        const signature =
          await web3Client?.solana?.signMessage("Hello, world!");
        setSignature(signature);
        console.log("Signature:", signature);
      }
    } catch (error) {
      console.error("Error signing message:", error);
    }
  };

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
        <ThemedText type="subtitle">Status</ThemedText>
        <ThemedText>
          <ThemedText type="defaultSemiBold">User info:</ThemedText>{" "}
          {state.user?.name || "Loading"}
        </ThemedText>
        <ThemedText type="defaultSemiBold">Wallet info:</ThemedText>
        <ThemedText>
          Solana: {web3Client?.solana?.address || "Loading"}
        </ThemedText>
        <ThemedText>
          {/*Balance: {web3Client?.solana?.getBalance() || "Loading"}*/}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <ThemedView style={styles.actionButton} onTouchEnd={signMessage}>
          <ThemedText style={styles.signOutText}>Sign Message</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Signed Message</ThemedText>
        <ThemedText>{signature}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <ThemedView style={styles.actionButton} onTouchEnd={sendTransaction}>
          <ThemedText style={styles.signOutText}>Send transaction</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Signed trasaction:</ThemedText>
        <ThemedText>{transaction}</ThemedText>
      </ThemedView>

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
  actionButton: {
    backgroundColor: "#007AFF",
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
