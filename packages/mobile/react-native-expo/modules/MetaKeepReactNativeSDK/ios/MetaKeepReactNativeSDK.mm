#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE (MetaKeepReactNativeSDK, NSObject)

// MetaKeep SDK init synchronous method
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(initialize : (NSString *)appId)

// MetaKeep SDK set user asynchronous method
RCT_EXTERN_METHOD(setUser
                  : (NSDictionary *)user withResolver
                  : (RCTPromiseResolveBlock)resolve withRejecter
                  : (RCTPromiseRejectBlock)reject)

// MetaKeep SDK sign message asynchronous method
RCT_EXTERN_METHOD(signMessage
                  : (NSString *)message withReason
                  : (NSString *)reason withResolver
                  : (RCTPromiseResolveBlock)resolve withRejecter
                  : (RCTPromiseRejectBlock)reject)

// MetaKeep SDK sign transaction asynchronous method
RCT_EXTERN_METHOD(signTransaction
                  : (NSDictionary *)transaction withReason
                  : (NSString *)reason withResolver
                  : (RCTPromiseResolveBlock)resolve withRejecter
                  : (RCTPromiseRejectBlock)reject)

// MetaKeep SDK sign typed data asynchronous method
RCT_EXTERN_METHOD(signTypedData
                  : (NSDictionary *)typedData withReason
                  : (NSString *)reason withResolver
                  : (RCTPromiseResolveBlock)resolve withRejecter
                  : (RCTPromiseRejectBlock)reject)

// MetaKeep SDK get consent asynchronous method
RCT_EXTERN_METHOD(getConsent
                  : (NSString *)consentToken withResolver
                  : (RCTPromiseResolveBlock)resolve withRejecter
                  : (RCTPromiseRejectBlock)reject)

// MetaKeep SDK get wallet asynchronous method
RCT_EXTERN_METHOD(getWallet
                  : (RCTPromiseResolveBlock)resolve withRejecter
                  : (RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

@end
