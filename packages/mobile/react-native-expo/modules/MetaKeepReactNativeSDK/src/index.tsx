import {NativeModules, Platform} from 'react-native';

const LINKING_ERROR =
  "The package 'metakeep-react-native-sdk' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ios: "- You have run 'pod install'\n", default: ''}) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const MetaKeepReactNativeSDK = NativeModules.MetaKeepReactNativeSDK
  ? NativeModules.MetaKeepReactNativeSDK
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

// Create a static class that exports native module methods
class MetaKeep {
  /**
   * Initializes the MetaKeepReactNativeSDK with the provided appId.
   * @param appId - The unique identifier for the app.
   * @throws Error if appId is not provided.
   */
  public constructor(appId: string) {
    if (!appId) {
      throw new Error('appId is required');
    }

    // Only one instance of the SDK can be initialized in
    // React Native.
    MetaKeepReactNativeSDK.initialize(appId);
  }

  /**
   * Sets the user for the MetaKeepReactNativeSDK.
   * @param user - The user to be set.
   * @throws Error if the user is not valid.
   */
  public async setUser(user: object): Promise<any> {
    if (!user) {
      throw new Error('user is required');
    }
    return this.handleNativeOperationPromise(
      MetaKeepReactNativeSDK.setUser(user),
    );
  }

  /**
   * Signs a message with MetaKeepReactNativeSDK.
   * @param message - The message to be signed.
   * @param reason - The reason for signing the message.
   * @returns A promise that resolves to an object representing the signed message.
   */
  public async signMessage(message: string, reason: string): Promise<object> {
    return this.handleNativeOperationPromise(
      MetaKeepReactNativeSDK.signMessage(message, reason),
    );
  }

  /**
   * Signs a transaction with MetaKeepReactNativeSDK.
   * @param transaction - The transaction to be signed.
   * @param reason - The reason for signing the transaction.
   * @returns A promise that resolves to an object representing the signed transaction.
   */
  public async signTransaction(
    transaction: object,
    reason: string,
  ): Promise<object> {
    return this.handleNativeOperationPromise(
      MetaKeepReactNativeSDK.signTransaction(transaction, reason),
    );
  }

  /**
   * Signs a typed data object with MetaKeepReactNativeSDK.
   * @param typedData - The typed data object to be signed.
   * @param reason - The reason for signing the typed data object.
   * @returns A promise that resolves to an object representing the signed typed data object.
   */
  public async signTypedData(
    typedData: object,
    reason: string,
  ): Promise<object> {
    return this.handleNativeOperationPromise(
      MetaKeepReactNativeSDK.signTypedData(typedData, reason),
    );
  }

  /**
   * Handles the get consent operation with MetaKeepReactNativeSDK.
   * @param consentToken - The consent token to be used for the get consent operation.
   * @returns A promise that resolves to an object representing the result of the native operation.
   */
  public async getConsent(consentToken: string): Promise<object> {
    return this.handleNativeOperationPromise(
      MetaKeepReactNativeSDK.getConsent(consentToken),
    );
  }

  /**
   * Gets the user's wallet with MetaKeepReactNativeSDK.
   * @returns A promise that resolves to an object representing the result of the native operation.
   */
  public async getWallet(): Promise<object> {
    return this.handleNativeOperationPromise(
      MetaKeepReactNativeSDK.getWallet(),
    );
  }

  private async handleNativeOperationPromise(
    nativeOperationPromise: Promise<object>,
  ): Promise<object> {
    return new Promise((resolve, reject) => {
      nativeOperationPromise
        .then((result: object) => {
          resolve(result);
        })
        .catch((error: {userInfo: object}) => {
          // Handle error.userInfo from native module.
          // Json Error is sent in the userInfo object.
          if (error.userInfo) {
            reject(error.userInfo);
            return;
          }

          reject(error);
        });
    });
  }
}

export default MetaKeep;
