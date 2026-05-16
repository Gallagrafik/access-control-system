class Employee {
  final String fullName;
  final String passportNumber;
  final String position;
  final String archivePhotoUrl;

  Employee({
    required this.fullName,
    required this.passportNumber,
    required this.position,
    required this.archivePhotoUrl,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      fullName: json['fullName'] ?? '',
      passportNumber: json['passportNumber'] ?? '',
      position: json['position'] ?? '',
      archivePhotoUrl: json['archivePhotoUrl'] ?? '',
    );
  }

  // Текущий залогиненный сотрудник (глобально для простоты на данном этапе)
  static Employee? current;

  // ПИН-код сотрудника (будет сохраняться в secure storage позже)
  static String pin = '';
}