import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import '../models/employee.dart';
import 'camera_screen.dart';
import 'profile_screen.dart';
import '../main.dart';   // ← важно для themeNotifier

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    final employee = Employee.current;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Сотрудник'),
        centerTitle: true,
        actions: [
          // Смена темы
          IconButton(
            icon: ValueListenableBuilder<bool>(
              valueListenable: themeNotifier,
              builder: (context, isDark, child) {
                return Icon(isDark ? Icons.light_mode : Icons.dark_mode);
              },
            ),
            onPressed: () {
              themeNotifier.value = !themeNotifier.value;
            },
          ),
          // Профиль
          IconButton(
            icon: const Icon(Icons.person, size: 28),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
            },
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.work_outline, size: 110, color: Colors.blue[400]),
              const SizedBox(height: 40),
              Text(
                employee?.fullName.split(' ').take(2).join(' ') ?? 'Сотрудник',
                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Подать заявку на вход и выход',
                style: TextStyle(fontSize: 18, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 80),

              ElevatedButton.icon(
                onPressed: () async {
                  final cameras = await availableCameras();
                  if (cameras.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Камера не найдена')),
                    );
                    return;
                  }
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CameraScreen()),
                  );
                },
                icon: const Icon(Icons.camera_alt, size: 36),
                label: const Text('Подать заявку'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 40),
                  textStyle: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
                  minimumSize: const Size(double.infinity, 90),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ),

              const SizedBox(height: 30),
              const Text(
                'Заявка создастся сразу на вход и выход\nс одним 4-значным кодом',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 15),
              ),
            ],
          ),
        ),
      ),
    );
  }
}