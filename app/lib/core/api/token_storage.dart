import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists auth tokens outside of app memory so a session survives restarts.
class TokenStorage {
  TokenStorage._();
  static final TokenStorage instance = TokenStorage._();

  final _storage = const FlutterSecureStorage();
  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';

  Future<void> save({required String accessToken, required String refreshToken}) async {
    await _storage.write(key: _accessKey, value: accessToken);
    await _storage.write(key: _refreshKey, value: refreshToken);
  }

  Future<String?> readAccessToken() => _storage.read(key: _accessKey);
  Future<String?> readRefreshToken() => _storage.read(key: _refreshKey);

  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}
