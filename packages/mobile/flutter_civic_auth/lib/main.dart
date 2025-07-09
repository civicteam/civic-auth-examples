import 'package:flutter/material.dart';
import 'package:flutter_civic_auth/providers/auth_provider.dart';
import 'package:flutter_civic_auth/screens/home_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables with fallback handling
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    // If .env file doesn't exist, continue with default values
    print('Warning: .env file not found. Using default configuration.');
    print('Please create a .env file with your Civic Auth credentials.');
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    print('MyApp: Building widget tree...');
    return ChangeNotifierProvider(
      create: (context) {
        print('MyApp: Creating AuthProvider...');
        return AuthProvider()..initialize();
      },
      child: MaterialApp(
        title: 'Civic Auth Flutter',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
        ),
        home: const HomeScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
