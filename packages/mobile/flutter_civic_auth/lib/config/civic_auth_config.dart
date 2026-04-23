import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_appauth/flutter_appauth.dart';

class CivicAuthConfig {
  static String get clientId =>
      dotenv.env['CIVIC_CLIENT_ID'] ?? '0c7322e4-eb11-42e6-9c7e-46bc22506eed';
  static String get authUrl =>
      dotenv.env['CIVIC_AUTH_URL'] ?? 'https://auth.civic.com/oauth';
  static String get appScheme => dotenv.env['APP_SCHEME'] ?? 'civicauthflutter';

  static String get authorizationEndpoint => '$authUrl/auth';
  static String get tokenEndpoint => '$authUrl/token';
  static String get userInfoEndpoint => '$authUrl/userinfo';
  static String get endSessionEndpoint => '$authUrl/session/end';
  static String get redirectUri => '$appScheme:///';

  static const List<String> scopes = ['openid', 'profile', 'email'];

  static AuthorizationServiceConfiguration get serviceConfiguration =>
      AuthorizationServiceConfiguration(
        authorizationEndpoint: authorizationEndpoint,
        tokenEndpoint: tokenEndpoint,
        endSessionEndpoint: endSessionEndpoint,
      );

  // Validation method to check if configuration is complete
  static bool get isConfigured {
    return clientId.isNotEmpty &&
        authUrl.isNotEmpty &&
        appScheme.isNotEmpty &&
        !clientId.contains('your-') &&
        !authUrl.contains('placeholder');
  }
}
