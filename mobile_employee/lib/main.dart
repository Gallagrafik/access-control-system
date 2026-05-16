import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/registration_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const MyApp());
}

// Глобальный notifier для темы (чтобы все экраны могли менять тему)
final themeNotifier = ValueNotifier<bool>(true);

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: themeNotifier,
      builder: (context, isDarkMode, child) {
        return MaterialApp(
          title: 'Сотрудник - Контроль доступа',
          debugShowCheckedModeBanner: false,
          theme: isDarkMode
              ? ThemeData.dark().copyWith(
                  scaffoldBackgroundColor: const Color(0xFF0A0A0A),
                  appBarTheme: const AppBarTheme(backgroundColor: Color(0xFF18181B)),
                )
              : ThemeData.light(),
          home: const RegistrationScreen(),
        );
      },
    );
  }
}