import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/employee.dart';
import '../services/device_service.dart';
import 'home_screen.dart';
import 'registration_screen.dart';

class LoginScreen extends StatefulWidget {
  final Employee? preloadedUser;
  const LoginScreen({super.key, this.preloadedUser});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _hasSavedDevice = false;
  Employee? _cachedUser;

  @override
  void initState() {
    super.initState();
    if (widget.preloadedUser != null) {
      print('📱 Получен preloadedUser, пропускаем проверку устройства');
      _cachedUser = widget.preloadedUser;
      Employee.current = _cachedUser;
      _hasSavedDevice = true;
    } else {
      _checkSavedDeviceAndAutoLogin();
    }
  }

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkSavedDeviceAndAutoLogin() async {
    print('🔐 Проверка сохранённого устройства...');
    
    final hasSaved = await Employee.hasSavedDevice();
    print('hasSaved = $hasSaved');
    
    if (!hasSaved) {
      print('➡️ Нет сохранённого устройства, идём на RegistrationScreen');
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const RegistrationScreen()),
        );
      }
      return;
    }

    setState(() => _hasSavedDevice = true);

    final deviceId = await Employee.getSavedDeviceId();
    print('deviceId из хранилища: $deviceId');
    
    if (deviceId == null || deviceId.isEmpty || deviceId.startsWith('fallback')) {
      print('❌ deviceId проблемный, очищаем и идём на RegistrationScreen');
      await Employee.clearAll();
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const RegistrationScreen()),
        );
      }
      return;
    }

    try {
      print('📡 Проверяем устройство на сервере: $deviceId');
      final response = await http.post(
        Uri.parse('http://10.75.148.69:3000/api/users/check-device'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'deviceId': deviceId}),
      );
      
      print('📡 Ответ сервера: ${response.statusCode}');
      print('📡 Тело: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['exists'] == true) {
          print('✅ Устройство привязано');
          _cachedUser = Employee.fromJson(data);
          Employee.current = _cachedUser;
          Employee.deviceId = deviceId;
          
          // Проверяем, есть ли пароль у пользователя
          // Делаем дополнительный запрос для проверки пароля
          final checkUserResponse = await http.post(
            Uri.parse('http://10.75.148.69:3000/api/users/check-employee'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({
              'fullName': _cachedUser!.fullName,
              'passportNumber': _cachedUser!.passportNumber,
            }),
          );
          
          if (checkUserResponse.statusCode == 200 || checkUserResponse.statusCode == 201) {
            final userData = json.decode(checkUserResponse.body);
            final hasPassword = userData['hasPassword'] == true || userData['hasPassword'] == 'true';
            
            if (!hasPassword) {
              print('⚠️ Устройство привязано, но пароль не установлен');
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (_) => RegistrationScreen(
                      preloadedUser: _cachedUser,
                      needToCreatePassword: true,
                    ),
                  ),
                );
                return;
              }
            }
          }
          
          // Если пароль есть, остаёмся на экране ввода пароля
        } else {
          print('⚠️ Устройство не привязано на сервере, очищаем');
          await Employee.clearAll();
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const RegistrationScreen()),
            );
          }
        }
      } else {
        print('❌ Ошибка сервера');
        setState(() => _hasSavedDevice = true);
      }
    } catch (e) {
      print('❌ Ошибка проверки устройства: $e');
      setState(() => _hasSavedDevice = true);
    }
  }

  Future<void> _loginWithPassword() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      String? deviceId = await Employee.getSavedDeviceId();
      
      if (deviceId == null || deviceId.isEmpty) {
        deviceId = await DeviceService.getDeviceId();
        await Employee.saveDeviceId(deviceId);
      }
      
      final deviceName = await DeviceService.getDeviceName();
      
      final passportToSend = _cachedUser?.passportNumber ?? '';
      print('🔐 Пытаемся войти:');
      print('   passportNumber: "$passportToSend"');
      print('   deviceId: $deviceId');
      print('   deviceName: $deviceName');
      
      final requestBody = json.encode({
        'passportNumber': passportToSend,
        'password': _passwordController.text,
        'deviceId': deviceId,
        'deviceName': deviceName,
      });
      
      final response = await http.post(
        Uri.parse('http://10.75.148.69:3000/api/users/login'),
        headers: {'Content-Type': 'application/json'},
        body: requestBody,
      );
      
      print('📡 Логин ответ: ${response.statusCode}');
      print('📡 Тело: ${response.body}');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        print('✅ Вход успешен!');
        Employee.current = Employee.fromJson(data['user']);
        await Employee.saveDeviceId(deviceId);
        _navigateToHome();
      } else if (response.statusCode == 401) {
        final error = json.decode(response.body);
        final errorMessage = error['message'] ?? '';
        
        if (errorMessage.contains('Пароль не установлен')) {
          print('⚠️ Пароль не установлен, перенаправляем на создание пароля');
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => RegistrationScreen(
                  preloadedUser: _cachedUser,
                  needToCreatePassword: true,
                ),
              ),
            );
          }
        } else {
          throw Exception(errorMessage);
        }
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Ошибка входа');
      }
    } catch (e) {
      print('❌ Ошибка входа: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _navigateToHome() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  Future<void> _logoutAndClear() async {
    await Employee.clearAll();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const RegistrationScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasSavedDevice && _cachedUser == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0A0A0A), Color(0xFF1A1A2E)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.security, size: 80, color: Colors.blueAccent),
                  const SizedBox(height: 20),
                  const Text(
                    'КПП Контроль доступа',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const Text(
                    'Вход для сотрудника',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                  const SizedBox(height: 40),
                  
                  if (_cachedUser != null) ...[
                    Text(
                      _cachedUser!.fullName,
                      style: const TextStyle(fontSize: 18, color: Colors.white),
                    ),
                    const SizedBox(height: 20),
                  ],
                  
                  Form(
                    key: _formKey,
                    child: TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Пароль',
                        labelStyle: TextStyle(color: Colors.grey),
                        prefixIcon: Icon(Icons.lock, color: Colors.grey),
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Colors.grey),
                        ),
                      ),
                      validator: (v) => v == null || v.isEmpty ? 'Введите пароль' : null,
                    ),
                  ),
                  
                  const SizedBox(height: 40),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _loginWithPassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Войти', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  TextButton(
                    onPressed: _logoutAndClear,
                    child: const Text(
                      'Это не моё устройство',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}