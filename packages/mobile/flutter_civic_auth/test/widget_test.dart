import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:flutter_civic_auth/main.dart';
import 'package:flutter_civic_auth/providers/auth_provider.dart';

void main() {
  setUpAll(() async {
    await dotenv.load(fileName: ".env.example");
  });

  testWidgets('App loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (context) => AuthProvider(),
        child: const MyApp(),
      ),
    );

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
