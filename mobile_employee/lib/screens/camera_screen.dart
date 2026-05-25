import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:convert';
import 'package:image/image.dart' as img;
import '../models/employee.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  CameraController? _controller;
  List<CameraDescription>? cameras;
  bool _isInitialized = false;
  String? _imagePath;
  bool _isTakingPhoto = false;
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    if (kIsWeb) {
      setState(() => _isInitialized = true);
      return;
    }
    cameras = await availableCameras();
    if (cameras != null && cameras!.isNotEmpty) {
      final frontCamera = cameras!.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras![0],
      );
      
      _controller = CameraController(frontCamera, ResolutionPreset.high);
      await _controller!.initialize();
      setState(() => _isInitialized = true);
    }
  }

  // Обрезка файла строго по той области, которую пользователь видел на экране
  Future<String> _cropImageTo3x4(String path) async {
    final bytes = await File(path).readAsBytes();
    img.Image? originalImage = img.decodeImage(bytes);
    if (originalImage == null) return path;

    // 1. Разворачиваем снимок по горизонтали (убираем инверсию), 
    // чтобы он стал точно таким же «зеркальным», каким был экран при съёмке
    originalImage = img.copyFlip(originalImage, direction: img.FlipDirection.horizontal);

    int origWidth = originalImage.width;
    int origHeight = originalImage.height;

    // 2. Рассчитываем размеры под пропорцию 3:4 от ширины
    int targetWidth = origWidth;
    int targetHeight = (origWidth * 4) ~/ 3;

    // Если высота кадра меньше целевой
    if (origHeight < targetHeight) {
      targetHeight = origHeight;
      targetWidth = (origHeight * 3) ~/ 4;
    }

    // 3. Вырезаем строго ЦЕНТРАЛЬНУЮ область кадра
    int x = (origWidth - targetWidth) ~/ 2;
    int y = (origHeight - targetHeight) ~/ 2;

    final img.Image croppedImage = img.copyCrop(
      originalImage,
      x: x,
      y: y,
      width: targetWidth,
      height: targetHeight,
    );

    // 4. Перезаписываем файл
    final croppedFile = await File(path).writeAsBytes(img.encodeJpg(croppedImage, quality: 90));
    return croppedFile.path;
  }

  Future<void> _takePicture() async {
    if (kIsWeb) {
      setState(() => _imagePath = 'web_test_photo.jpg');
      return;
    }
    if (_controller == null || !_controller!.value.isInitialized) return;

    setState(() => _isTakingPhoto = true);
    try {
      final XFile photo = await _controller!.takePicture();
      final String croppedPath = await _cropImageTo3x4(photo.path);

      setState(() {
        _imagePath = croppedPath;
        _isTakingPhoto = false;
      });
    } catch (e) {
      setState(() => _isTakingPhoto = false);
    }
  }

  Future<void> _submitRequest() async {
    if (_imagePath == null) return;

    setState(() => _isUploading = true);

    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('http://localhost:3000/api/access-request/create'),
      );

      request.fields['deviceId'] = Employee.deviceId;

      if (!kIsWeb) {
        request.files.add(await http.MultipartFile.fromPath('selfie', _imagePath!));
      } else {
        request.files.add(http.MultipartFile.fromBytes(
          'selfie',
          [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 96, 0, 0, 0, 2, 0, 1, 244, 33, 116, 217, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130],
          filename: 'web_selfie.png',
        ));
      }

      final response = await request.send();

      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseBody = await response.stream.bytesToString();
        final Map<String, dynamic> responseData = json.decode(responseBody);
        final generatedCode = responseData['code'] ?? '0000';

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Успешно! Ваш код для прохода на КПП: $generatedCode'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 5),
            ),
          );
          Navigator.pop(context);
        }
      } else {
        final responseBody = await response.stream.bytesToString();
        throw Exception('Код ${response.statusCode}: $responseBody');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка отправки: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (kIsWeb) {
      return Scaffold(
        appBar: AppBar(title: const Text('Селфи (Web)')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.camera_alt, size: 120, color: Colors.grey),
              const SizedBox(height: 30),
              ElevatedButton(
                onPressed: () => setState(() => _imagePath = 'web_test.jpg'),
                child: const Text('Симулировать селфи'),
              ),
              if (_imagePath != null)
                ElevatedButton(
                  onPressed: _submitRequest,
                  child: const Text('Отправить заявку на сервер'),
                ),
            ],
          ),
        ),
      );
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final cameraHeight = (screenWidth * 4) / 3; // Идеальная высота для формата 3:4

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Основной контент: Камера сверху, управление снизу
            Column(
              children: [
                // 1. Область камеры строго в формате 3:4 с защитой от растягивания (зеркало включено)
                Container(
                  width: screenWidth,
                  height: cameraHeight,
                  color: Colors.black,
                  child: ClipRect(
                    child: OverflowBox(
                      alignment: Alignment.center, // Центрируем поток камеры на экране
                      child: FittedBox(
                        fit: BoxFit.cover, // Заполняем область без искажения пропорций
                        child: SizedBox(
                          width: _controller!.value.previewSize!.height,
                          height: _controller!.value.previewSize!.width,
                          child: CameraPreview(_controller!), // Обычное нативное превью
                        ),
                      ),
                    ),
                  ),
                ),
                // 2. Чёрная нижняя область для кнопки съёмки
                Expanded(
                  child: Container(
                    color: Colors.black,
                    child: Center(
                      child: FloatingActionButton.large(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        onPressed: _isTakingPhoto ? null : _takePicture,
                        child: Icon(_isTakingPhoto ? Icons.hourglass_empty : Icons.camera_alt, size: 40),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Иконка "Назад" поверх камеры в левом верхнем углу
            Positioned(
              top: 10,
              left: 10,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white, size: 28),
                onPressed: () => Navigator.pop(context),
              ),
            ),

            // Экран предпросмотра (показывается после снимка)
            if (_imagePath != null)
              Positioned.fill(
                child: Container(
                  color: Colors.black,
                  child: Column(
                    children: [
                      // Картинка 3:4 сверху
                      Container(
                        width: screenWidth,
                        height: cameraHeight,
                        color: Colors.black,
                        child: Image.file(
                          File(_imagePath!),
                          fit: BoxFit.cover,
                        ),
                      ),
                      // Нижняя панель подтверждения
                      Expanded(
                        child: Container(
                          color: Colors.black,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              OutlinedButton(
                                onPressed: () => setState(() => _imagePath = null),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.white,
                                  side: const BorderSide(color: Colors.white24),
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                ),
                                child: const Text('Переснять'),
                              ),
                              const SizedBox(width: 30),
                              ElevatedButton(
                                onPressed: _isUploading ? null : _submitRequest,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.indigo,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                ),
                                child: _isUploading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                      )
                                    : const Text('Отправить'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
