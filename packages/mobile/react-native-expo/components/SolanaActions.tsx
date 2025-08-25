import { useState, useContext, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AuthContext } from "@/contexts/AuthContext";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function SolanaActions() {
  const { web3Client } = useContext(AuthContext);

  const [signature, setSignature] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<string | null>(null);
  const [messageToSign, setMessageToSign] = useState<string>("Hello, world!");
  const [recipientAddress, setRecipientAddress] = useState<string>(
    "AK531DxnLT5SkL6BBAY52Db7xw2NcEVabXt6aUVmiBGX",
  );
  const [solAmount, setSolAmount] = useState<string>("0.001");
  const [balance, setBalance] = useState<number | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState<boolean>(false);
  const [isSendingTransaction, setIsSendingTransaction] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (web3Client?.solana) {
        const balance = await web3Client?.solana?.getBalance();
        setBalance(balance || 0);
      }
    };
    fetchBalance();
  }, [web3Client?.solana]);

  const sendTransaction = async () => {
    try {
      setIsSendingTransaction(true);
      if (web3Client) {
        const transaction = await web3Client?.solana?.sendTransaction(
          recipientAddress,
          parseFloat(solAmount),
        );
        setTransaction(transaction);
        console.log("Transaction:", transaction);
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      Alert.alert("Error", "Failed to send transaction. Please try again.");
    } finally {
      setIsSendingTransaction(false);
    }
  };

  const signMessage = async () => {
    try {
      setIsSigningMessage(true);
      if (web3Client) {
        const signature = await web3Client?.solana?.signMessage(
          messageToSign,
          "Sign a message",
        );
        setSignature(signature);
        console.log("Signature:", signature);
      }
    } catch (error) {
      console.error("Error signing message:", error);
      Alert.alert("Error", "Failed to sign message. Please try again.");
    } finally {
      setIsSigningMessage(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", `${type} copied to clipboard`, [{ text: "OK" }]);
  };

  const openTransactionExplorer = async (txHash: string) => {
    const url = `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open URL:", error);
      Alert.alert("Error", "Could not open Solana Explorer");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle" style={styles.headerText}>
          🔗 SOLANA
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={[styles.section, styles.sectionCard]}>
          <ThemedText style={styles.sectionTitle}>Wallet Info</ThemedText>
          <ThemedView style={styles.walletInfo}>
            <ThemedText style={styles.walletLabel}>Address:</ThemedText>
            <TouchableOpacity
              onPress={() =>
                web3Client?.solana?.address &&
                copyToClipboard(web3Client.solana.address, "Wallet address")
              }
              activeOpacity={0.7}
            >
              <ThemedText style={styles.walletAddress}>
                {web3Client?.solana?.address || "Loading..."}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.walletLabel}>Balance:</ThemedText>
            <ThemedText style={styles.walletBalance}>
              {balance !== null
                ? `${balance / LAMPORTS_PER_SOL} SOL`
                : "Loading..."}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={[styles.section, styles.sectionCard]}>
          <ThemedText style={styles.sectionTitle}>Sign Message</ThemedText>
          <ThemedView style={styles.inputContainer}>
            <ThemedText>Message to sign:</ThemedText>
            <TextInput
              style={styles.input}
              value={messageToSign}
              onChangeText={setMessageToSign}
              placeholder="Enter message to sign"
              placeholderTextColor="#999"
            />
          </ThemedView>

          <ThemedView style={styles.buttonContainer}>
            <ThemedView
              style={[
                styles.actionButton,
                (!web3Client?.solana || isSigningMessage) &&
                  styles.disabledButton,
              ]}
              onTouchEnd={
                web3Client?.solana && !isSigningMessage
                  ? signMessage
                  : undefined
              }
            >
              {isSigningMessage ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <ThemedText
                  style={[
                    styles.buttonText,
                    !web3Client?.solana && styles.disabledButtonText,
                  ]}
                >
                  {web3Client?.solana ? "Sign Message" : "Wallet Not Connected"}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          {signature && (
            <TouchableOpacity
              style={styles.resultContainer}
              onPress={() => copyToClipboard(signature, "Signature")}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.resultLabel}>
                Signed Message (tap to copy):
              </ThemedText>
              <ThemedText style={styles.resultText}>{signature}</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        <ThemedView style={[styles.section, styles.sectionCard]}>
          <ThemedText style={styles.sectionTitle}>Send Transaction</ThemedText>
          <ThemedView style={styles.inputContainer}>
            <ThemedText>Recipient Address:</ThemedText>
            <TextInput
              style={styles.input}
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholder="Enter recipient wallet address"
              placeholderTextColor="#999"
            />
            <ThemedText>Amount (SOL):</ThemedText>
            <TextInput
              style={styles.input}
              value={solAmount}
              onChangeText={setSolAmount}
              placeholder="Enter amount in SOL"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </ThemedView>

          <ThemedView style={styles.buttonContainer}>
            <ThemedView
              style={[
                styles.actionButton,
                (!web3Client?.solana || isSendingTransaction) &&
                  styles.disabledButton,
              ]}
              onTouchEnd={
                web3Client?.solana && !isSendingTransaction
                  ? sendTransaction
                  : undefined
              }
            >
              {isSendingTransaction ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <ThemedText
                  style={[
                    styles.buttonText,
                    !web3Client?.solana && styles.disabledButtonText,
                  ]}
                >
                  {web3Client?.solana
                    ? "Send Transaction"
                    : "Wallet Not Connected"}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          {transaction && (
            <ThemedView style={styles.resultContainer}>
              <TouchableOpacity
                onPress={() => copyToClipboard(transaction, "Transaction hash")}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.resultLabel}>
                  Transaction Hash (tap to copy):
                </ThemedText>
                <ThemedText style={styles.resultText}>{transaction}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.explorerLink}
                onPress={() => openTransactionExplorer(transaction)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.explorerLinkText}>
                  🔗 View on Solana Explorer
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    marginHorizontal: -20,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#9945FF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginHorizontal: 20,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  content: {
    padding: 20,
    backgroundColor: "transparent",
  },
  section: {
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  inputContainer: {
    gap: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#f8f8f8",
    color: "#000",
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: "#14F195",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: "#14F195",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    shadowOpacity: 0,
  },
  disabledButtonText: {
    color: "#666666",
  },
  resultContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  resultLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  resultText: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
  },
  walletInfo: {
    gap: 8,
  },
  walletLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  walletAddress: {
    fontSize: 13,
    color: "#007AFF",
    fontFamily: "monospace",
    textDecorationLine: "underline",
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  explorerLink: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#9945FF",
    borderRadius: 6,
    alignSelf: "center",
  },
  explorerLinkText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
});
