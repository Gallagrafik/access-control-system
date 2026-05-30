import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/device_service.dart';

class Employee {
  final String id;
  final String fullName;
  final String passportNumber;
  final String position;
  final String archivePhotoUrl;

  Employee({
    required this.id,
    required this.fullName,
    required this.passportNumber,
    required this.position,
    required this.archivePhotoUrl,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      passportNumber: json['passportNumber'] ?? '',
      position: json['position'] ?? '',
      archivePhotoUrl: json['archivePhotoUrl'] ?? '',
    );
  }

  static Employee? current;
  static String deviceId = '';
  
  static final _storage = FlutterSecureStorage();
  static const String _deviceIdKey = 'employee_device_id';
  
  static Future<String> initializeDevice() async {
    final id = await DeviceService.getDeviceId();
    deviceId = id;
    print('📱 Устройство инициализировано: $deviceId');
    return id;
  }
  
  static Future<void> saveDeviceId(String id) async {
    print('💾 Сохраняем deviceId: $id');
    await _storage.write(key: _deviceIdKey, value: id);
    deviceId = id;
  }
  
  static Future<String?> getSavedDeviceId() async {
    final id = await _storage.read(key: _deviceIdKey);
    if (id != null && id.isNotEmpty) {
      deviceId = id;
      print('📱 Получен сохранённый deviceId: $id');
      return id;
    }
    final newId = await DeviceService.getDeviceId();
    await saveDeviceId(newId);
    return newId;
  }
  
  static Future<void> clearAll() async {
    print('🗑️ Очищаем все данные');
    await _storage.delete(key: _deviceIdKey);
    await DeviceService.resetDeviceId();
    deviceId = '';
    current = null;
  }
  
  static Future<bool> hasSavedDevice() async {
    final id = await _storage.read(key: _deviceIdKey);
    final has = id != null && id.isNotEmpty;
    print('🔍 Есть сохранённое устройство: $has');
    return has;
  }
}