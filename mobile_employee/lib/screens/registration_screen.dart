import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/employee.dart';
import 'home_screen.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  String _fullName = '';
  String _passportNumber = '';
  String _pin = '';

  // Нормализация номера паспорта (убираем пробелы и дефисы)
  String _normalizePassport(String input) {
    return input.replaceAll(RegExp(r'[^0-9]'), '');
  }

  // Загрузка списка сотрудников
  Future<List<Employee>> _loadEmployees() async {
    try {
      final String response = await rootBundle.loadString('assets/employees.json');
      final data = await json.decode(response) as List;
      return data.map((json) => Employee.fromJson(json)).toList();
    } catch (e) {
      print("Ошибка загрузки employees.json: $e");
      return [];
    }
  }

  void _register() async {
    if (!_formKey.currentState!.validate()) return;

    final employees = await _loadEmployees();
    final normalizedInput = _normalizePassport(_passportNumber);

    // Поиск сотрудника
    final foundEmployee = employees.firstWhere(
      (emp) =>
          emp.fullName.toLowerCase().trim() == _fullName.toLowerCase().trim() &&
          _normalizePassport(emp.passportNumber) == normalizedInput,
      orElse: () => Employee(
        fullName: '',
        passportNumber: '',
        position: '',
        archivePhotoUrl: '',
      ),
    );

    if (foundEmployee.fullName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Такого сотрудника нет в базе предприятия'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    // Успешная регистрация
    Employee.current = foundEmployee;
    Employee.pin = _pin;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Регистрация успешна!'),
        backgroundColor: Colors.green,
      ),
    );

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Регистрация')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              const Icon(Icons.person_add, size: 90, color: Colors.blue),
              const SizedBox(height: 30),
              const Text(
                'Регистрация сотрудника',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 40),

              TextFormField(
                decoration: const InputDecoration(labelText: 'ФИО полностью'),
                onChanged: (v) => _fullName = v,
                validator: (v) => v!.trim().isEmpty ? 'Введите ФИО' : null,
              ),
              const SizedBox(height: 16),

              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Номер паспорта',
                  hintText: '4512 345678 или 4512345678',
                ),
                onChanged: (v) => _passportNumber = v,
                validator: (v) => v!.trim().isEmpty ? 'Введите номер паспорта' : null,
              ),
              const SizedBox(height: 24),

              TextFormField(
                decoration: const InputDecoration(labelText: 'ПИН-код (4 цифры)'),
                keyboardType: TextInputType.number,
                maxLength: 4,
                obscureText: true,
                onChanged: (v) => _pin = v,
                validator: (v) => v!.length != 4 ? 'Введите 4 цифры' : null,
              ),
              const SizedBox(height: 50),

              ElevatedButton(
                onPressed: _register,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  minimumSize: const Size(double.infinity, 60),
                ),
                child: const Text('Зарегистрироваться', style: TextStyle(fontSize: 20)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}