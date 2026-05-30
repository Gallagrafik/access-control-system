import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class DeviceService {
  static final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  static final FlutterSecureStorage _storage = FlutterSecureStorage();
  static const String _deviceIdKey = 'device_unique_id';
  static String? _cachedDeviceId;
  
  // Получение уникального стабильного ID устройства
  static Future<String> getDeviceId() async {
    // Возвращаем кэшированное значение
    if (_cachedDeviceId != null && _cachedDeviceId!.isNotEmpty) {
      print('📱 Возвращаем кэшированный deviceId: $_cachedDeviceId');
      return _cachedDeviceId!;
    }
    
    // Проверяем в secure storage
    final savedId = await _storage.read(key: _deviceIdKey);
    if (savedId != null && savedId.isNotEmpty && !savedId.startsWith('fallback')) {
      print('📱 Используем сохранённый deviceId из storage: $savedId');
      _cachedDeviceId = savedId;
      return savedId;
    }
    
    // Генерируем новый ID
    String deviceId;
    
    if (kIsWeb) {
      deviceId = await _getWebDeviceId();
    } else if (Platform.isAndroid) {
      deviceId = await _getAndroidDeviceId();
    } else if (Platform.isIOS) {
      deviceId = await _getIosDeviceId();
    } else {
      deviceId = _getFallbackDeviceId();
    }
    
    // Сохраняем полученный ID
    await _storage.write(key: _deviceIdKey, value: deviceId);
    _cachedDeviceId = deviceId;
    print('📱 Создан и сохранён новый deviceId: $deviceId');
    
    return deviceId;
  }
  
  // Для Android - используем model как стабильный ID
  static Future<String> _getAndroidDeviceId() async {
    try {
      final androidInfo = await _deviceInfo.androidInfo;
      
      // Используем модель устройства (HONORELI-N39) - она стабильная
      final model = androidInfo.model;
      if (model.isNotEmpty) {
        print('📱 Получена модель Android: $model');
        return 'android-$model';
      }
      
      // Запасной вариант: fingerprint
      final fingerprint = androidInfo.fingerprint;
      if (fingerprint != null && fingerprint.isNotEmpty) {
        print('📱 Получен fingerprint: $fingerprint');
        return 'android-${fingerprint.hashCode.abs()}';
      }
      
      throw Exception('Не удалось получить идентификатор Android');
    } catch (e) {
      print('❌ Ошибка получения Android ID: $e');
      return _getFallbackDeviceId();
    }
  }
  
  // Для iOS - используем identifierForVendor
  static Future<String> _getIosDeviceId() async {
    try {
      final iosInfo = await _deviceInfo.iosInfo;
      if (iosInfo.identifierForVendor != null && iosInfo.identifierForVendor!.isNotEmpty) {
        return 'ios-${iosInfo.identifierForVendor}';
      }
      throw Exception('Не удалось получить identifierForVendor');
    } catch (e) {
      print('❌ Ошибка получения iOS ID: $e');
      return _getFallbackDeviceId();
    }
  }
  
  // Для Web
  static Future<String> _getWebDeviceId() async {
    try {
      final webInfo = await _deviceInfo.webBrowserInfo;
      final userAgent = webInfo.userAgent ?? '';
      final platform = webInfo.platform ?? '';
      final combined = '$userAgent-$platform';
      return 'web-${combined.hashCode.abs()}';
    } catch (e) {
      return _getFallbackDeviceId();
    }
  }
  
  // Fallback - используем model если есть
  static String _getFallbackDeviceId() {
    return 'fallback-${DateTime.now().millisecondsSinceEpoch}';
  }
  
  // Получение понятного имени устройства
  static Future<String> getDeviceName() async {
    if (kIsWeb) {
      return 'Web Browser';
    } else if (Platform.isAndroid) {
      try {
        final androidInfo = await _deviceInfo.androidInfo;
        return androidInfo.model.isNotEmpty ? androidInfo.model : 'Android Device';
      } catch (e) {
        return 'Android Device';
      }
    } else if (Platform.isIOS) {
      try {
        final iosInfo = await _deviceInfo.iosInfo;
        return iosInfo.model.isNotEmpty ? iosInfo.model : 'iOS Device';
      } catch (e) {
        return 'iOS Device';
      }
    }
    return 'Unknown Device';
  }
  
  // Сброс сохранённого deviceId
  static Future<void> resetDeviceId() async {
    await _storage.delete(key: _deviceIdKey);
    _cachedDeviceId = null;
    print('🗑️ DeviceId сброшен');
  }
}