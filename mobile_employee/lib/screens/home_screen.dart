import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/employee.dart';
import 'camera_screen.dart';
import 'profile_screen.dart';
import '../main.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _activeRequests = [];
  bool _isLoading = false;
  final String _deviceId = 'device-id-chrome-employee';

  @override
  void initState() {
    super.initState();
    _fetchUserRequests();
  }

  // Загрузка заявок сотрудника с бэкенда NestJS
  Future<void> _fetchUserRequests() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final response = await http.get(
        Uri.parse('http://192.168.0.101:3000/api/access-request/user/$_deviceId'),
      );
      if (response.statusCode == 200) {
        setState(() {
          _activeRequests = json.decode(response.body);
        });
      }
    } catch (e) {
      print('Ошибка получения заявок сотрудника: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final employee = Employee.current;
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Сотрудник'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchUserRequests, // Кнопка ручного обновления списка
          ),
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
      body: RefreshIndicator(
        onRefresh: _fetchUserRequests,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const SizedBox(height: 10),
              const Icon(Icons.work_outline, size: 80, color: Colors.blue),
              const SizedBox(height: 20),
              Text(
                employee?.fullName.split(' ').take(2).join(' ') ?? 'Сотрудник',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 30),

              // Кнопка подачи заявки
              ElevatedButton.icon(
                onPressed: () async {
                  final cameras = await availableCameras();
                  if (mounted) {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const CameraScreen()),
                    );
                    _fetchUserRequests(); // Обновляем список после возвращения с экрана камеры
                  }
                },
                icon: const Icon(Icons.camera_alt, size: 28),
                label: const Text('Подать заявку'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  minimumSize: const Size(double.infinity, 65),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),

              const SizedBox(height: 40),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Мои активные пропуски:',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
              ),
              const SizedBox(height: 16),

              // Список активных заявок из PostgreSQL
              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else if (_activeRequests.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.05), // Исправлено на Colors.grey
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.withOpacity(0.1)), // Исправлено на Colors.grey
                  ),
                  child: const Center(
                    child: Text(
                      'У вас нет активных заявок.\nНажмите кнопку выше, чтобы создать.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _activeRequests.length,
                  itemBuilder: (context, index) {
                    final req = _activeRequests[index];
                    final isReady = req['requestType'] == 'IN';
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: isDarkMode ? 0 : 2,
                      // Жестко привязываем цвета к общей переменной экрана
                      color: isDarkMode ? const Color(0xFF18181B) : Colors.white,
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: isReady ? Colors.green.withOpacity(0.1) : Colors.amber.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            isReady ? Icons.login : Icons.logout,
                            color: isReady ? Colors.green : Colors.amber,
                          ),
                        ),
                        title: Text(
                          'Код доступа: ${req['code']}',
                          style: TextStyle(
                            fontFamily: 'Mono', 
                            fontSize: 18, 
                            fontWeight: FontWeight.bold, 
                            color: isDarkMode ? Colors.blue[300] : Colors.blue[700], // Контрастный синий под обе темы
                          ),
                        ),
                        subtitle: Text(
                          'Тип: ${isReady ? "На вход" : "На выход"} • Статус: Ожидание',
                          style: TextStyle(
                            fontSize: 13, 
                            color: isDarkMode ? Colors.grey[400] : Colors.grey[700], // Контрастный серый текст под обе темы
                          ),
                        ),
                        trailing: Icon(
                          Icons.hourglass_bottom, 
                          color: isDarkMode ? Colors.grey[500] : Colors.grey[600], 
                          size: 20,
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
