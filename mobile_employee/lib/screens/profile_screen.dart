import 'package:flutter/material.dart';
import '../models/employee.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _hideData = true;

  // Функция перевода русских букв в латиницу для генерации инициалов
  String _transliterateChar(String char) {
    const dict = {
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH',
      'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
      'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'KH', 'Ц': 'TS',
      'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
    };
    return dict[char.toUpperCase()] ?? char.toUpperCase();
  }

  // Динамическая генерация URL архивного фото по шаблону (как на бэкенде)
  String _getArchivePhotoUrl(dynamic employee) {
    if (employee == null) return 'https://via.placeholder.com/400x500/1E40AF/FFFFFF?text=Фото';
    
    // 1. Если бэкенд уже прислал готовую ссылку, используем её
    if (employee.archivePhotoUrl != null && employee.archivePhotoUrl.startsWith('http')) {
      return employee.archivePhotoUrl;
    }

    // 2. Если ссылки нет, генерируем её вручную из ФИО и Паспорта
    if (employee.fullName == null || employee.passportNumber == null) {
      return 'https://via.placeholder.com/400x500/1E40AF/FFFFFF?text=Фото';
    }

    final nameParts = employee.fullName.trim().split(RegExp(r'\s+'));
    final initials = nameParts.map((part) {
      if (part.isEmpty) return '';
      return _transliterateChar(part[0]);
    }).join('');

    final passportClean = employee.passportNumber.replaceAll(RegExp(r'\s+'), '');
    
    // IP-адрес и бакет MinIO
    const minioEndpoint = 'http://192.168.0.101:9000';
    const minioBucket = 'access-photos';

    return '$minioEndpoint/$minioBucket/archive/$initials$passportClean.jpg';
  }

  @override
  Widget build(BuildContext context) {
    final employee = Employee.current;
    
    // Проверяем текущую тему устройства (светлая или тёмная)
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Профиль')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const SizedBox(height: 20),
            CircleAvatar(
              radius: 70,
              backgroundColor: Colors.grey[300],
              backgroundImage: NetworkImage(_getArchivePhotoUrl(employee)),
            ),
            const SizedBox(height: 30),
            Text(
              employee?.fullName ?? 'Сотрудник',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              employee?.position ?? '',
              style: const TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 40),

            // Карточка с адаптивным цветом под светлую и тёмную темы
            Card(
              elevation: 2,
              color: isDarkMode ? const Color(0xFF1F1F1F) : Colors.grey[100],
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Паспортные данные', 
                      style: TextStyle(
                        fontSize: 18, 
                        fontWeight: FontWeight.w600,
                        color: isDarkMode ? Colors.white : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Номер паспорта:',
                      style: TextStyle(color: isDarkMode ? Colors.grey[400] : Colors.grey[600]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _hideData ? '•••••• ••••••' : (employee?.passportNumber ?? ''),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                        color: isDarkMode ? Colors.white : Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 30),

            ElevatedButton(
              onPressed: () {
                setState(() => _hideData = !_hideData);
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                minimumSize: const Size(double.infinity, 56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: Text(_hideData ? 'Показать данные' : 'Скрыть данные'),
            ),

            const Spacer(),
          ],
        ),
      ),
    );
  }
}
