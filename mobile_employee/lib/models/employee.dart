class Employee {
  final String id; // ← Добавили поле для UUID из базы данных
  final String fullName;
  final String passportNumber;
  final String position;
  final String archivePhotoUrl;

  Employee({
    required this.id, // ← Сделали обязательным
    required this.fullName,
    required this.passportNumber,
    required this.position,
    required this.archivePhotoUrl,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] ?? '', // ← Считываем ID, пришедший от сервера
      fullName: json['fullName'] ?? '',
      passportNumber: json['passportNumber'] ?? '',
      position: json['position'] ?? '',
      archivePhotoUrl: json['archivePhotoUrl'] ?? '',
    );
  }

  static Employee? current;
  static String pin = '';
}
