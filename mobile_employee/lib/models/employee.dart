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
  static String pin = '';
  static String deviceId = 'device-id-chrome-employee';
}
