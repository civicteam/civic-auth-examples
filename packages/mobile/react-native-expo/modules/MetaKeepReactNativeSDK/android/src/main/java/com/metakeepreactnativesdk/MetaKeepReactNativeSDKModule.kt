package com.metakeepreactnativesdk

import com.facebook.react.bridge.JSONArguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import org.json.JSONObject
import xyz.metakeep.sdk.*

class MetaKeepReactNativeSDKModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    private lateinit var sdk: MetaKeep

    override fun getName(): String {
        return NAME
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun initialize(appId: String) {
        sdk = MetaKeep(appId, AppContext(currentActivity!!))
    }

    @ReactMethod
    fun setUser(
        user: ReadableMap,
        promise: Promise,
    ) {
        // Only email is supported for now
        user.getString(EMAIL_FIELD)?.let {
            sdk.user = User(email = it)
            promise.resolve(null)
        } ?: run {
            rejectWithErrorStatus(INVALID_USER_ERROR_STATUS, promise)
        }
    }

    @ReactMethod
    fun signMessage(
        message: String,
        reason: String,
        promise: Promise,
    ) {
        sdk.signMessage(message, reason, getCallback(promise))
    }

    @ReactMethod
    fun signTransaction(
        transaction: ReadableMap,
        reason: String,
        promise: Promise,
    ) {
        sdk.signTransaction(readableMapToJsonRequest(transaction), reason, getCallback(promise))
    }

    @ReactMethod
    fun signTypedData(
        typedData: ReadableMap,
        reason: String,
        promise: Promise,
    ) {
        sdk.signTypedData(readableMapToJsonRequest(typedData), reason, getCallback(promise))
    }

    @ReactMethod
    fun getConsent(
        consentToken: String,
        promise: Promise,
    ) {
        sdk.getConsent(consentToken, getCallback(promise))
    }

    @ReactMethod
    fun getWallet(promise: Promise) {
        sdk.getWallet(getCallback(promise))
    }

    private fun getCallback(promise: Promise): Callback {
        return Callback(
            onSuccess = { response: JsonResponse ->
                promise.resolve(jsonResponseToWriteableMap(response))
            },
            // Pack the actual JSON error response into the userInfo map.
            // This will be extracted in the JS layer and returned as the error.
            onFailure = { error: JsonResponse ->
                promise.reject(OPERATION_FAILED_ERROR_STATUS, jsonResponseToWriteableMap(error))
            },
        )
    }

    private fun jsonResponseToWriteableMap(response: JsonResponse): WritableMap {
        // We convert the response to a JSON string and then parse it back to a WritableMap
        // so we can pass it to the JS layer.
        val writableMap = WritableNativeMap()
        writableMap.merge(JSONArguments.fromJSONObject(JSONObject(response.data.toString())))
        return writableMap
    }

    private fun readableMapToJsonRequest(map: ReadableMap): JsonRequest {
        // We convert the ReadableMap to a JSON string and then parse it back to a JsonRequest
        return JsonRequest(JSONObject(map.toHashMap()).toString())
    }

    private fun rejectWithErrorStatus(
        status: String,
        promise: Promise,
    ) {
        val userInfo = WritableNativeMap()
        userInfo.putString(STATUS_FIELD, status)
        promise.reject(status, userInfo)
    }

    companion object {
        const val NAME = "MetaKeepReactNativeSDK"

        // Error status
        const val INVALID_USER_ERROR_STATUS = "INVALID_USER"
        const val OPERATION_FAILED_ERROR_STATUS = "OPERATION_FAILED"

        // Constant strings
        const val EMAIL_FIELD = "email"
        const val STATUS_FIELD = "status"
    }
}
