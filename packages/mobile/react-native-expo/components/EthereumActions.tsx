// import { useState, useContext, useEffect } from "react";
// import {
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   Linking,
// } from "react-native";
// import * as Clipboard from "expo-clipboard";
// import { ThemedText } from "@/components/ThemedText";
// import { ThemedView } from "@/components/ThemedView";
// import { AuthContext } from "@/contexts/AuthContext";
// import { useBalance, useSendTransaction } from "wagmi";
// import { sepolia } from "viem/chains";
// import { parseEther } from "viem";

// export function EthereumActions() {
//   const { web3Client } = useContext(AuthContext);

//   const [signature, setSignature] = useState<string | null>(null);
//   const [transaction, setTransaction] = useState<string | null>(null);
//   const [messageToSign, setMessageToSign] =
//     useState<string>("Hello, Ethereum!");
//   const [recipientAddress, setRecipientAddress] = useState<string>("");
//   const [ethAmount, setEthAmount] = useState<string>("0.001");
//   const [isSigningMessage, setIsSigningMessage] = useState<boolean>(false);
//   const [isSendingTransaction, setIsSendingTransaction] =
//     useState<boolean>(false);
//   const { data: balance } = useBalance({
//     address: web3Client?.ethereum?.address || undefined,
//     chainId: sepolia.id,
//   });

//   const { sendTransaction, isSuccess, isPending, failureReason, error } =
//     useSendTransaction();
//   console.log(isPending, isSuccess, failureReason, error);

//   const sendTransactionHandler = async () => {
//     try {
//       console.log("Sending transaction...");
//       const result = sendTransaction({
//         to: "0x27d2869c753953773CEfa2dDE3bddC80581Fd760",
//         value: parseEther("0.01"),
//       });
//       console.log(result);
//       setIsSendingTransaction(true);
//     } catch (error) {
//       console.error("Error sending transaction:", error);
//       Alert.alert("Error", "Failed to send transaction. Please try again.");
//     } finally {
//       setIsSendingTransaction(false);
//     }
//   };

//   const signMessage = async () => {
//     try {
//       setIsSigningMessage(true);
//       // TODO: Implement Ethereum message signing
//       // if (web3Client) {
//       //   const signature = await web3Client?.ethereum?.signMessage(
//       //     messageToSign,
//       //     "Sign a message",
//       //   );
//       //   setSignature(signature);
//       // }
//     } catch (error) {
//       console.error("Error signing message:", error);
//       Alert.alert("Error", "Failed to sign message. Please try again.");
//     } finally {
//       setIsSigningMessage(false);
//     }
//   };

//   const copyToClipboard = async (text: string, type: string) => {
//     await Clipboard.setStringAsync(text);
//     Alert.alert("Copied!", `${type} copied to clipboard`, [{ text: "OK" }]);
//   };

//   const openTransactionExplorer = async (txHash: string) => {
//     // Using Sepolia testnet for Ethereum
//     const url = `https://sepolia.etherscan.io/tx/${txHash}`;
//     try {
//       await Linking.openURL(url);
//     } catch (error) {
//       console.error("Failed to open URL:", error);
//       Alert.alert("Error", "Could not open Etherscan");
//     }
//   };

//   const requestFaucet = async () => {
//     const ethereumAddress = web3Client?.ethereum?.address;
//     if (ethereumAddress) {
//       // Using Sepolia faucet
//       const url = `https://sepoliafaucet.com/`;
//       try {
//         await Linking.openURL(url);
//       } catch (error) {
//         console.error("Failed to open URL:", error);
//         Alert.alert("Error", "Could not open Ethereum Faucet");
//       }
//     }
//   };

//   return (
//     <ThemedView style={styles.container}>
//       <ThemedView style={styles.header}>
//         <ThemedText type="subtitle" style={styles.headerText}>
//           ⟠ ETHEREUM (sepolia)
//         </ThemedText>
//       </ThemedView>

//       <ThemedView style={styles.content}>
//         <ThemedView style={[styles.section, styles.sectionCard]}>
//           <ThemedText style={styles.sectionTitle}>Wallet Info</ThemedText>
//           <ThemedView style={styles.walletInfo}>
//             <ThemedText style={styles.walletLabel}>Address:</ThemedText>
//             <TouchableOpacity
//               onPress={() =>
//                 copyToClipboard(
//                   web3Client?.ethereum.address || "",
//                   "Wallet address",
//                 )
//               }
//               activeOpacity={0.7}
//             >
//               <ThemedText style={styles.walletAddress}>
//                 {web3Client?.ethereum.address ||
//                   "Ethereum wallet not connected"}
//               </ThemedText>
//             </TouchableOpacity>
//             <ThemedText style={styles.walletLabel}>Balance:</ThemedText>
//             <ThemedView style={styles.balanceRow}>
//               <ThemedText style={styles.walletBalance}>
//                 {balance !== null ? `${balance?.formatted} ETH` : "Loading..."}
//               </ThemedText>
//               <TouchableOpacity
//                 style={styles.faucetButton}
//                 onPress={requestFaucet}
//                 activeOpacity={0.7}
//               >
//                 <ThemedText style={styles.faucetButtonText}>
//                   💧 Request Testnet ETH
//                 </ThemedText>
//               </TouchableOpacity>
//             </ThemedView>
//           </ThemedView>
//         </ThemedView>

//         <ThemedView style={[styles.section, styles.sectionCard]}>
//           <ThemedText style={styles.sectionTitle}>Sign Message</ThemedText>
//           <ThemedView style={styles.inputContainer}>
//             <ThemedText>Message to sign:</ThemedText>
//             <TextInput
//               style={styles.input}
//               value={messageToSign}
//               onChangeText={setMessageToSign}
//               placeholder="Enter message to sign"
//               placeholderTextColor="#999"
//             />
//           </ThemedView>

//           <ThemedView style={styles.buttonContainer}>
//             <ThemedView
//               style={[
//                 styles.actionButton,
//                 (!web3Client || isSigningMessage) && styles.disabledButton,
//               ]}
//               onTouchEnd={
//                 web3Client && !isSigningMessage ? signMessage : undefined
//               }
//             >
//               {isSigningMessage ? (
//                 <ActivityIndicator size="small" color="#fff" />
//               ) : (
//                 <ThemedText
//                   style={[
//                     styles.buttonText,
//                     !web3Client && styles.disabledButtonText,
//                   ]}
//                 >
//                   {web3Client ? "Sign Message" : "Wallet Not Connected"}
//                 </ThemedText>
//               )}
//             </ThemedView>
//           </ThemedView>

//           {signature && (
//             <TouchableOpacity
//               style={styles.resultContainer}
//               onPress={() => copyToClipboard(signature, "Signature")}
//               activeOpacity={0.7}
//             >
//               <ThemedText style={styles.resultLabel}>
//                 Signed Message (tap to copy):
//               </ThemedText>
//               <ThemedText style={styles.resultText}>{signature}</ThemedText>
//             </TouchableOpacity>
//           )}
//         </ThemedView>

//         <ThemedView style={[styles.section, styles.sectionCard]}>
//           <ThemedText style={styles.sectionTitle}>Send Transaction</ThemedText>
//           <ThemedView style={styles.inputContainer}>
//             <ThemedText>Recipient Address:</ThemedText>
//             <TextInput
//               style={styles.input}
//               value={recipientAddress}
//               onChangeText={setRecipientAddress}
//               placeholder="Enter recipient wallet address (0x...)"
//               placeholderTextColor="#999"
//             />
//             <ThemedText>Amount (ETH):</ThemedText>
//             <TextInput
//               style={styles.input}
//               value={ethAmount}
//               onChangeText={setEthAmount}
//               placeholder="Enter amount in ETH"
//               placeholderTextColor="#999"
//               keyboardType="numeric"
//             />
//           </ThemedView>

//           <ThemedView style={styles.buttonContainer}>
//             <ThemedView
//               style={[
//                 styles.actionButton,
//                 (!web3Client || isSendingTransaction) && styles.disabledButton,
//               ]}
//               onTouchEnd={
//                 web3Client && !isSendingTransaction
//                   ? sendTransactionHandler
//                   : undefined
//               }
//             >
//               {isSendingTransaction ? (
//                 <ActivityIndicator size="small" color="#fff" />
//               ) : (
//                 <ThemedText
//                   style={[
//                     styles.buttonText,
//                     !web3Client && styles.disabledButtonText,
//                   ]}
//                 >
//                   {web3Client ? "Send Transaction" : "Wallet Not Connected"}
//                 </ThemedText>
//               )}
//             </ThemedView>
//           </ThemedView>

//           {transaction && (
//             <ThemedView style={styles.resultContainer}>
//               <TouchableOpacity
//                 onPress={() => copyToClipboard(transaction, "Transaction hash")}
//                 activeOpacity={0.7}
//               >
//                 <ThemedText style={styles.resultLabel}>
//                   Transaction Hash (tap to copy):
//                 </ThemedText>
//                 <ThemedText style={styles.resultText}>{transaction}</ThemedText>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.explorerLink}
//                 onPress={() => openTransactionExplorer(transaction)}
//                 activeOpacity={0.7}
//               >
//                 <ThemedText style={styles.explorerLinkText}>
//                   🔗 View on Etherscan
//                 </ThemedText>
//               </TouchableOpacity>
//             </ThemedView>
//           )}
//         </ThemedView>
//       </ThemedView>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     marginVertical: 16,
//     marginHorizontal: -20,
//     backgroundColor: "transparent",
//     overflow: "hidden",
//   },
//   header: {
//     backgroundColor: "#627EEA",
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//     marginHorizontal: 20,
//   },
//   headerText: {
//     color: "white",
//     fontWeight: "bold",
//     fontSize: 18,
//     textAlign: "center",
//   },
//   content: {
//     padding: 20,
//     backgroundColor: "transparent",
//   },
//   section: {
//     marginBottom: 16,
//   },
//   sectionCard: {
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "rgba(128, 128, 128, 0.2)",
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 12,
//   },
//   inputContainer: {
//     gap: 8,
//     marginBottom: 12,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "rgba(128, 128, 128, 0.4)",
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 14,
//     backgroundColor: "rgba(255, 255, 255, 0.2)",
//   },
//   buttonContainer: {
//     alignItems: "center",
//     marginTop: 12,
//   },
//   actionButton: {
//     backgroundColor: "#627EEA",
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 8,
//     shadowColor: "#627EEA",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   disabledButton: {
//     backgroundColor: "#cccccc",
//     shadowOpacity: 0,
//   },
//   disabledButtonText: {
//     color: "#666666",
//   },
//   resultContainer: {
//     marginTop: 12,
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "rgba(128, 128, 128, 0.3)",
//   },
//   resultLabel: {
//     fontSize: 12,
//     opacity: 0.7,
//     marginBottom: 4,
//   },
//   resultText: {
//     fontSize: 12,
//     fontFamily: "monospace",
//   },
//   walletInfo: {
//     gap: 8,
//   },
//   walletLabel: {
//     fontSize: 14,
//     opacity: 0.7,
//     fontWeight: "500",
//   },
//   walletAddress: {
//     fontSize: 13,
//     color: "#627EEA",
//     fontFamily: "monospace",
//     textDecorationLine: "underline",
//     marginBottom: 8,
//   },
//   walletBalance: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   explorerLink: {
//     marginTop: 12,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     backgroundColor: "#627EEA",
//     borderRadius: 6,
//     alignSelf: "center",
//   },
//   explorerLinkText: {
//     color: "white",
//     fontSize: 13,
//     fontWeight: "600",
//   },
//   balanceRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   faucetButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     backgroundColor: "#4A90E2",
//     borderRadius: 6,
//   },
//   faucetButtonText: {
//     color: "white",
//     fontSize: 12,
//     fontWeight: "600",
//   },
// });
