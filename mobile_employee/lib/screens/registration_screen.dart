import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/employee.dart';
import '../services/device_service.dart';
import 'home_screen.dart';
import 'login_screen.dart';

class RegistrationScreen extends StatefulWidget {
  final Employee? preloadedUser;
  final bool needToCreatePassword;
  
  const RegistrationScreen({
    super.key, 
    this.preloadedUser,
    this.needToCreatePassword = false,
  });

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _passportController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _isLoading = false;
  bool _isCreatingPassword = false;
  String? _cachedPassportNumber;
  String? _cachedUserId;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    
    // Если передан preloadedUser и нужно создать пароль
    if (widget.preloadedUser != null && widget.needToCreatePassword) {
      print('📱 Переход в режим создания пароля для: ${widget.preloadedUser!.fullName}');
      _cachedUserId = widget.preloadedUser!.id;
      _cachedPassportNumber = widget.preloadedUser!.passportNumber;
      _isCreatingPassword = true;
      
      // Заполняем поля ФИО и паспорт
      _fullNameController.text = widget.preloadedUser!.fullName;
      _passportController.text = widget.preloadedUser!.passportNumber;
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _passportController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _checkEmployee() async {
    print('🚀 _checkEmployee НАЧАЛО');
    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });
    
    if (!_formKey.currentState!.validate()) {
      print('❌ Валидация не пройдена');
      setState(() => _isLoading = false);
      return;
    }
    
    print('📡 Отправляем запрос...');
    try {
      final response = await http.post(
        Uri.parse('http://10.75.148.69:3000/api/users/check-employee'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'fullName': _fullNameController.text.trim(),
          'passportNumber': _passportController.text.trim(),
        }),
      );
      
      print('📡 Ответ: ${response.statusCode}');
      print('📡 Тело: ${response.body}');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        
        if (data['exists'] == true) {
          _cachedPassportNumber = data['passportNumber'];
          _cachedUserId = data['userId'];
          
          final hasPassword = data['hasPassword'] == true || data['hasPassword'] == 'true';
          final deviceId = await DeviceService.getDeviceId();
          
          // Проверяем, привязано ли это устройство к пользователю
          final deviceCheckResponse = await http.post(
            Uri.parse('http://10.75.148.69:3000/api/users/check-device'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'deviceId': deviceId}),
          );
          
          final deviceData = json.decode(deviceCheckResponse.body);
          final isDeviceBound = deviceData['exists'] == true && deviceData['userId'] == _cachedUserId;
          
          print('hasPassword: $hasPassword, isDeviceBound: $isDeviceBound');
          
          if (hasPassword && isDeviceBound) {
            print('➡️ Есть пароль и устройство привязано, идём на LoginScreen');
            if (mounted) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => LoginScreen(
                    preloadedUser: Employee(
                      id: _cachedUserId!,
                      fullName: _fullNameController.text.trim(),
                      passportNumber: _cachedPassportNumber!,
                      position: '',
                      archivePhotoUrl: '',
                    ),
                  ),
                ),
              );
            }
          } else if (hasPassword && !isDeviceBound) {
            print('➡️ Есть пароль, но устройство не привязано, идём на LoginScreen для привязки');
            if (mounted) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => LoginScreen(
                    preloadedUser: Employee(
                      id: _cachedUserId!,
                      fullName: _fullNameController.text.trim(),
                      passportNumber: _cachedPassportNumber!,
                      position: '',
                      archivePhotoUrl: '',
                    ),
                  ),
                ),
              );
            }
          } else {
            print('➡️ Нет пароля, переходим к созданию пароля');
            setState(() {
              _isCreatingPassword = true;
              _isLoading = false;
            });
          }
        } else {
          setState(() {
            _errorMessage = 'Сотрудник не найден в базе предприятия';
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _errorMessage = 'Ошибка проверки данных';
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Ошибка: $e');
      setState(() {
        _errorMessage = 'Ошибка соединения с сервером';
        _isLoading = false;
      });
    }
  }

  Future<void> _createPassword() async {
    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });
    
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() {
        _errorMessage = 'Пароли не совпадают';
        _isLoading = false;
      });
      return;
    }
    
    if (_passwordController.text.length < 8) {
      setState(() {
        _errorMessage = 'Пароль должен быть не менее 8 символов';
        _isLoading = false;
      });
      return;
    }
    
    try {
      final deviceId = await DeviceService.getDeviceId();
      final deviceName = await DeviceService.getDeviceName();
      
      print('📱 Создаём пароль для deviceId: $deviceId');
      print('📱 Имя устройства: $deviceName');
      
      // Определяем, какой passportNumber использовать
      final passportToUse = _cachedPassportNumber ?? _passportController.text.trim();
      
      final response = await http.post(
        Uri.parse('http://10.75.148.69:3000/api/users/set-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'passportNumber': passportToUse,
          'password': _passwordController.text,
          'deviceId': deviceId,
          'deviceName': deviceName,
        }),
      );
      
      print('📡 Ответ: ${response.statusCode}');
      print('📡 Тело: ${response.body}');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        
        await Employee.saveDeviceId(deviceId);
        Employee.current = Employee.fromJson(data['user']);
        Employee.deviceId = deviceId;
        
        print('✅ Пароль создан, устройство привязано');
        
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const HomeScreen()),
          );
        }
      } else {
        final error = json.decode(response.body);
        setState(() {
          _errorMessage = error['message'] ?? 'Ошибка создания пароля';
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Ошибка: $e');
      setState(() {
        _errorMessage = 'Ошибка соединения с сервером';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool hideFormFields = widget.preloadedUser != null && widget.needToCreatePassword;
    
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
                  const Icon(Icons.person_add, size: 80, color: Colors.blueAccent),
                  const SizedBox(height: 20),
                  Text(
                    _isCreatingPassword ? 'Создание пароля' : 'Проверка сотрудника',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 40),
                  
                  if (_errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  
                  Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        if (!_isCreatingPassword && !hideFormFields) ...[
                          TextFormField(
                            controller: _fullNameController,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              labelText: 'ФИО полностью',
                              labelStyle: TextStyle(color: Colors.grey),
                              prefixIcon: Icon(Icons.person, color: Colors.grey),
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Colors.grey),
                              ),
                            ),
                            validator: (v) => v!.trim().isEmpty ? 'Введите ФИО' : null,
                          ),
                          const SizedBox(height: 20),
                          TextFormField(
                            controller: _passportController,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              labelText: 'Номер паспорта',
                              labelStyle: TextStyle(color: Colors.grey),
                              prefixIcon: Icon(Icons.credit_card, color: Colors.grey),
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Colors.grey),
                              ),
                            ),
                            validator: (v) => v!.trim().isEmpty ? 'Введите номер паспорта' : null,
                          ),
                        ] else if (hideFormFields && !_isCreatingPassword) ...[
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.grey.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  widget.preloadedUser!.fullName,
                                  style: const TextStyle(color: Colors.white, fontSize: 18),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  widget.preloadedUser!.passportNumber,
                                  style: const TextStyle(color: Colors.grey, fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                        if (_isCreatingPassword) ...[
                          TextFormField(
                            controller: _passwordController,
                            obscureText: true,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              labelText: 'Пароль (минимум 8 символов)',
                              labelStyle: TextStyle(color: Colors.grey),
                              prefixIcon: Icon(Icons.lock, color: Colors.grey),
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Colors.grey),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          TextFormField(
                            controller: _confirmPasswordController,
                            obscureText: true,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              labelText: 'Подтвердите пароль',
                              labelStyle: TextStyle(color: Colors.grey),
                              prefixIcon: Icon(Icons.lock_outline, color: Colors.grey),
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Colors.grey),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 40),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        print('🖱️ КНОПКА НАЖАТА');
                        if (_isLoading) return;
                        if (_isCreatingPassword) {
                          _createPassword();
                        } else {
                          _checkEmployee();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(_isCreatingPassword ? 'Создать пароль' : 'Продолжить'),
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