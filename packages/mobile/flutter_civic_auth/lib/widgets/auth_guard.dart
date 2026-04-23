import 'package:flutter/material.dart';
import 'package:flutter_civic_auth/widgets/auth_screen.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/auth_state.dart';

class AuthGuard extends StatelessWidget {
  final Widget child;
  final Widget? fallback;

  const AuthGuard({super.key, required this.child, this.fallback});

  @override
  Widget build(BuildContext context) {
    print('AuthGuard: Building...');
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final state = authProvider.state;
        print(
          'AuthGuard: Current state - ${state.status}, authenticated: ${state.isAuthenticated}, loading: ${state.isLoading}',
        );

        if (state.isLoading) {
          print('AuthGuard: Showing loading state (AuthScreen)');
          return fallback ?? const AuthScreen();
        }

        if (!state.isAuthenticated) {
          print('AuthGuard: User not authenticated, showing AuthScreen');
          return fallback ?? const AuthScreen();
        }

        print('AuthGuard: User authenticated, showing protected content');
        return child;
      },
    );
  }
}
