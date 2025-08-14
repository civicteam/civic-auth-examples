
import 'dart:convert';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config/civic_auth_config.dart';
import '../models/auth_user.dart';

class AuthService {
  static const FlutterAppAuth _appAuth = FlutterAppAuth();
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  // Storage keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _idTokenKey = 'id_token';
  static const String _expiresAtKey = 'expires_at';

  static Future<AuthorizationTokenResponse?> signIn() async {
    try {
      final result = await _appAuth.authorizeAndExchangeCode(
        AuthorizationTokenRequest(
          CivicAuthConfig.clientId,
          CivicAuthConfig.redirectUri,
          serviceConfiguration: CivicAuthConfig.serviceConfiguration,
          scopes: CivicAuthConfig.scopes,
        ),
      );

      if (result != null) {
        await _storeTokens(result);
      }

      return result;
    } on FlutterAppAuthUserCancelledException {
      // User cancelled the auth flow
      return null;
    } catch (e) {
      throw Exception('Authentication failed: $e');
    }
  }

  static Future<void> signOut() async {
    try {
      final idToken = await _secureStorage.read(key: _idTokenKey);
      
      if (idToken != null) {
        await _appAuth.endSession(
          EndSessionRequest(
            idTokenHint: idToken,
            postLogoutRedirectUrl: CivicAuthConfig.redirectUri,
            serviceConfiguration: CivicAuthConfig.serviceConfiguration,
          ),
        );
      }
    } catch (e) {
      // Continue with local sign out even if end session fails
    } finally {
      await _clearTokens();
    }
  }

  static Future<AuthUser?> getUserInfo(String accessToken) async {
    try {
      final response = await http.get(
        Uri.parse(CivicAuthConfig.userInfoEndpoint),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        final userData = json.decode(response.body);
        return AuthUser.fromJson(userData);
      }
    } catch (e) {
      throw Exception('Failed to fetch user info: $e');
    }
    return null;
  }

  static Future<TokenResponse?> refreshToken(String refreshToken) async {
    try {
      return await _appAuth.token(
        TokenRequest(
          CivicAuthConfig.clientId,
          CivicAuthConfig.redirectUri,
          serviceConfiguration: CivicAuthConfig.serviceConfiguration,
          refreshToken: refreshToken,
          scopes: CivicAuthConfig.scopes,
        ),
      );
    } catch (e) {
      throw Exception('Token refresh failed: $e');
    }
  }

  static Future<String?> getStoredAccessToken() async {
    return await _secureStorage.read(key: _accessTokenKey);
  }

  static Future<String?> getStoredRefreshToken() async {
    return await _secureStorage.read(key: _refreshTokenKey);
  }

  static Future<String?> getStoredIdToken() async {
    return await _secureStorage.read(key: _idTokenKey);
  }

  static Future<DateTime?> getTokenExpiration() async {
    final expiresAtString = await _secureStorage.read(key: _expiresAtKey);
    if (expiresAtString != null) {
      return DateTime.parse(expiresAtString);
    }
    return null;
  }

  static Future<bool> isTokenValid() async {
    final expiresAt = await getTokenExpiration();
    if (expiresAt == null) return false;
    return DateTime.now().isBefore(expiresAt);
  }

  static Future<void> _storeTokens(AuthorizationTokenResponse result) async {
    await _secureStorage.write(key: _accessTokenKey, value: result.accessToken);
    
    if (result.refreshToken != null) {
      await _secureStorage.write(key: _refreshTokenKey, value: result.refreshToken);
    }
    
    if (result.idToken != null) {
      await _secureStorage.write(key: _idTokenKey, value: result.idToken);
    }

    if (result.accessTokenExpirationDateTime != null) {
      await _secureStorage.write(
        key: _expiresAtKey,
        value: result.accessTokenExpirationDateTime!.toIso8601String(),
      );
    }
  }

  static Future<void> _clearTokens() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _idTokenKey);
    await _secureStorage.delete(key: _expiresAtKey);
  }
}
