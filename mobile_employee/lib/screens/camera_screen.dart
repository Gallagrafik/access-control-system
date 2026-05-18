import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;
import '../models/employee.dart';
import 'dart:convert';

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
      _controller = CameraController(cameras![0], ResolutionPreset.high);
      await _controller!.initialize();
      setState(() => _isInitialized = true);
    }
  }

  Future<void> _takePicture() async {
    if (kIsWeb) {
      setState(() => _imagePath = 'web_test_photo.jpg');
      return;
    }
    if (_controller == null || !_controller!.value.isInitialized) return;

    setState(() => _isTakingPhoto = true);
    final XFile photo = await _controller!.takePicture();
    setState(() {
      _imagePath = photo.path;
      _isTakingPhoto = false;
    });
  }

  // Реальная отправка на бэкенд (Один запрос создает IN + OUT на сервере)
  Future<void> _submitRequest() async {
    if (_imagePath == null) return;

    setState(() => _isUploading = true);

    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('http://localhost:3000/api/access-request/create'),
      );

      request.fields['deviceId'] = 'device-id-chrome-employee';

      if (!kIsWeb) {
        request.files.add(await http.MultipartFile.fromPath('selfie', _imagePath!));
      } else {
        // Передаем корректный пустой массив байтов для Web/Chrome
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

    // Реальная камера
    return Scaffold(
      appBar: AppBar(title: const Text('Съёмка селфи')),
      body: Stack(
        children: [
          CameraPreview(_controller!),

          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: FloatingActionButton.large(
                onPressed: _isTakingPhoto ? null : _takePicture,
                child: Icon(_isTakingPhoto ? Icons.hourglass_empty : Icons.camera, size: 40),
              ),
            ),
          ),

          if (_imagePath != null)
            Positioned.fill(
              child: Container(
                color: Colors.black.withOpacity(0.95),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.file(File(_imagePath!), width: 280, height: 380, fit: BoxFit.cover),
                    const SizedBox(height: 30),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton(
                          onPressed: () => setState(() => _imagePath = null),
                          child: const Text('Переснять'),
                        ),
                        const SizedBox(width: 20),
                        ElevatedButton(
                          onPressed: _isUploading ? null : _submitRequest,
                          child: _isUploading
                              ? const CircularProgressIndicator(color: Colors.white)
                              : const Text('Отправить заявку'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}