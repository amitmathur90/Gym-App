import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Central place for environment-dependent config.
///
/// Override at build/run time with:
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.10:4000/api
class AppConfig {
  static String get apiBaseUrl {
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) return override;

    if (kIsWeb) return 'http://localhost:4000/api';
    // The Android emulator maps the host machine's localhost to 10.0.2.2.
    if (Platform.isAndroid) return 'http://10.0.2.2:4000/api';
    return 'http://localhost:4000/api';
  }
}
