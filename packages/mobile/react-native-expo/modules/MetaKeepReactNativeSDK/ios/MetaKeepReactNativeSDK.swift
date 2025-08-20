import MetaKeep

@objc(MetaKeepReactNativeSDK)
class MetaKeepReactNativeSDK: NSObject {

  @objc(initialize:)
  func initialize(appId: String) -> Any {
    sdk = MetaKeep(appId: appId, appContext: AppContext())
    return 0
  }

  @objc(setUser:withResolver:withRejecter:)
  func setUser(
    user: NSDictionary, resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    // Only email is supported for now
    if user[EMAIL_FIELD] == nil {
      rejectWithErrorStatus(
        errorStatus: INVALID_USER_ERROR_STATUS, reject: reject)
      return
    }

    sdk!.user =
      User(
        email: user[EMAIL_FIELD] as! String
      )

    resolve(nil)
  }

  @objc(signMessage:withReason:withResolver:withRejecter:)
  func signMessage(
    message: String, reason: String, resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    sdk!.signMessage(
      message: message,
      reason: reason,
      callback: getCallback(resolve: resolve, reject: reject))
  }

  @objc(signTransaction:withReason:withResolver:withRejecter:)
  func signTransaction(
    transaction: NSDictionary, reason: String, resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      sdk!.signTransaction(
        transaction: try NSDictionaryToJsonRequest(dictionary: transaction),
        reason: reason,
        callback: getCallback(resolve: resolve, reject: reject))
    } catch {
      rejectWithErrorStatus(errorStatus: INVALID_TRANSACTION_ERROR_STATUS, reject: reject)
    }
  }

  @objc(signTypedData:withReason:withResolver:withRejecter:)
  func signTypedData(
    typedData: NSDictionary, reason: String, resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      sdk!.signTypedData(
        typedData: try NSDictionaryToJsonRequest(dictionary: typedData),
        reason: reason,
        callback: getCallback(resolve: resolve, reject: reject))
    } catch {
      rejectWithErrorStatus(errorStatus: INVALID_TYPED_DATA_ERROR_STATUS, reject: reject)
    }
  }

  @objc(getConsent:withResolver:withRejecter:)
  func getConsent(
    consentToken: String, resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    sdk!.getConsent(
      consentToken: consentToken,
      callback: getCallback(resolve: resolve, reject: reject))
  }

  @objc(getWallet:withRejecter:)
  func getWallet(
    resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock
  ) {
    sdk!.getWallet(
      callback: getCallback(resolve: resolve, reject: reject))
  }

  private func getCallback(
    resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock
  ) -> Callback {
    return Callback(
      onSuccess: { (result: JsonResponse) in
        resolve(result.data)
      },
      onFailure: { (error: JsonResponse) in
        reject(
          self.OPERATION_FAILED_ERROR_STATUS, self.OPERATION_FAILED_ERROR_STRING,
          NSError(
            domain: self.METAKEEP_DOMAIN, code: -1,
            // Pack the actual JSON error response into the NSError userInfo.
            // This will be extracted in the JS layer and returned as the error.
            userInfo: error.data as NSDictionary? as? [String: Any])
        )
      }
    )
  }

  private func NSDictionaryToJsonRequest(dictionary: NSDictionary) throws -> JsonRequest {
    let jsonString = String(
      bytes: try JSONSerialization.data(withJSONObject: dictionary), encoding: .utf8)!
    return try JsonRequest(jsonString: jsonString)
  }

  private func rejectWithErrorStatus(
    errorStatus: String, reject: @escaping RCTPromiseRejectBlock
  ) {
    reject(
      errorStatus, OPERATION_FAILED_ERROR_STRING,
      NSError(
        domain: METAKEEP_DOMAIN, code: -1, userInfo: [STATUS_FIELD: errorStatus]
      ))
  }

  // Holds the MetaKeep SDK instance
  private var sdk: MetaKeep?

  // Error status
  private let INVALID_USER_ERROR_STATUS = "INVALID_USER"
  private let INVALID_TRANSACTION_ERROR_STATUS = "INVALID_TRANSACTION"
  private let INVALID_TYPED_DATA_ERROR_STATUS = "INVALID_TYPED_DATA"
  private let OPERATION_FAILED_ERROR_STATUS = "OPERATION_FAILED"

  // Error strings
  private let INVALID_TRANSACTION_ERROR_STRING = "Invalid transaction"
  private let INVALID_TYPED_DATA_ERROR_STRING = "Invalid typed data"
  private let OPERATION_FAILED_ERROR_STRING = "MetaKeep SDK operation failed"

  // Constant strings
  private let METAKEEP_DOMAIN = "MetaKeep"
  private let EMAIL_FIELD = "email"
  private let STATUS_FIELD = "status"
}
