import 'package:flutter/foundation.dart';
import '../service/auth_service.dart';
import '../models/auth_state.dart';
import '../models/auth_user.dart';

class AuthProvider extends ChangeNotifier {
  AuthState _state = const AuthState();

  AuthState get state => _state;

  Future<void> initialize() async {
    print('AuthProvider: Starting initialization...');
    _setState(_state.copyWith(status: AuthStatus.loading));

    try {
      print('AuthProvider: Checking stored tokens...');
      final accessToken = await AuthService.getStoredAccessToken();

      if (accessToken != null && await AuthService.isTokenValid()) {
        print('AuthProvider: Valid token found, fetching user info...');
        final user = await AuthService.getUserInfo(accessToken);
        final refreshToken = await AuthService.getStoredRefreshToken();
        final idToken = await AuthService.getStoredIdToken();
        final expiresAt = await AuthService.getTokenExpiration();

        if (user != null) {
          print('AuthProvider: User authenticated: ${user.name}');
          _setState(
            AuthState(
              status: AuthStatus.authenticated,
              user: user,
              accessToken: accessToken,
              refreshToken: refreshToken,
              idToken: idToken,
              expiresAt: expiresAt,
            ),
          );
          return;
        }
      }
    } catch (e) {
      print('AuthProvider: Error initializing auth: $e');
      debugPrint('Error initializing auth: $e');
    }

    print('AuthProvider: Setting state to unauthenticated');
    _setState(_state.copyWith(status: AuthStatus.unauthenticated));
  }

  Future<void> signIn() async {
    try {
      _setState(_state.copyWith(status: AuthStatus.loading));

      final result = await AuthService.signIn();

      if (result?.accessToken != null) {
        final user = await AuthService.getUserInfo(result!.accessToken!);

        if (user != null) {
          _setState(
            AuthState(
              status: AuthStatus.authenticated,
              user: user,
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              idToken: result.idToken,
              expiresAt: result.accessTokenExpirationDateTime,
            ),
          );
          return;
        }
      }

      _setState(_state.copyWith(status: AuthStatus.unauthenticated));
    } catch (e) {
      debugPrint('Sign in error: $e');
      _setState(_state.copyWith(status: AuthStatus.unauthenticated));
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      await AuthService.signOut();
    } catch (e) {
      debugPrint('Sign out error: $e');
    } finally {
      _setState(const AuthState(status: AuthStatus.unauthenticated));
    }
  }

  Future<void> refreshTokens() async {
    if (_state.refreshToken == null) return;

    try {
      final result = await AuthService.refreshToken(_state.refreshToken!);

      if (result?.accessToken != null) {
        final user = await AuthService.getUserInfo(result!.accessToken!);

        if (user != null) {
          _setState(
            _state.copyWith(
              user: user,
              accessToken: result.accessToken,
              refreshToken: result.refreshToken ?? _state.refreshToken,
              idToken: result.idToken ?? _state.idToken,
              expiresAt: result.accessTokenExpirationDateTime,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Token refresh error: $e');
      await signOut();
    }
  }

  void _setState(AuthState newState) {
    _state = newState;
    notifyListeners();
  }
}
