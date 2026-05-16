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

  // Реальная отправка на бэкенд (IN + OUT одновременно)
  Future<void> _submitRequest() async {
    if (_imagePath == null) return;

    setState(() => _isUploading = true);

    try {
      final deviceId = 'flutter-device-${DateTime.now().millisecondsSinceEpoch}';

      // Отправляем две заявки (IN и OUT) с одним кодом
      for (String type in ['IN', 'OUT']) {
        var request = http.MultipartRequest(
          'POST',
          Uri.parse('http://localhost:3000/api/access-request/create'),
        );

        request.fields['deviceId'] = deviceId;
        request.fields['requestType'] = type;

        if (!kIsWeb) {
          request.files.add(await http.MultipartFile.fromPath('selfie', _imagePath!));
        }

        final response = await request.send();

        if (response.statusCode != 200) {
          throw Exception('Ошибка при отправке заявки $type');
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Заявки IN + OUT успешно отправлены!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context); // возвращаемся на главный экран
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