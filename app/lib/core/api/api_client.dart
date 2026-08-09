import 'package:dio/dio.dart';
import '../config/app_config.dart';
import 'api_exception.dart';
import 'token_storage.dart';

/// Thin wrapper around Dio that attaches the bearer token to every request,
/// transparently refreshes an expired access token once, and normalizes
/// errors into [ApiException].
class ApiClient {
  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (!options.extra.containsKey('skipAuth')) {
            final token = await TokenStorage.instance.readAccessToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final isAuthRoute = error.requestOptions.path.startsWith('/auth/');
          if (error.response?.statusCode == 401 && !isAuthRoute && !_isRetry(error.requestOptions)) {
            final refreshed = await _tryRefresh();
            if (refreshed) {
              try {
                final retried = await _dio.fetch(_markRetry(error.requestOptions));
                handler.resolve(retried);
                return;
              } catch (_) {
                // fall through to original error
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._internal();
  late final Dio _dio;

  bool _isRetry(RequestOptions options) => options.extra['retried'] == true;
  RequestOptions _markRetry(RequestOptions options) {
    options.extra['retried'] = true;
    return options;
  }

  Future<bool> _tryRefresh() async {
    final refreshToken = await TokenStorage.instance.readRefreshToken();
    if (refreshToken == null) return false;
    try {
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(extra: {'skipAuth': true}),
      );
      await TokenStorage.instance.save(
        accessToken: response.data['accessToken'],
        refreshToken: response.data['refreshToken'],
      );
      return true;
    } catch (_) {
      await TokenStorage.instance.clear();
      return false;
    }
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) async {
    final res = await _request(() => _dio.get(path, queryParameters: query));
    return _asMap(res.data);
  }

  Future<List<dynamic>> getList(String path, {Map<String, dynamic>? query}) async {
    final res = await _request(() => _dio.get(path, queryParameters: query));
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> post(String path, {Object? data}) async {
    final res = await _request(() => _dio.post(path, data: data));
    return _asMap(res.data);
  }

  Future<Map<String, dynamic>> patch(String path, {Object? data}) async {
    final res = await _request(() => _dio.patch(path, data: data));
    return _asMap(res.data);
  }

  Future<void> delete(String path) async {
    await _request(() => _dio.delete(path));
  }

  Map<String, dynamic> _asMap(dynamic data) {
    if (data == null) return {};
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Response> _request(Future<Response> Function() run) async {
    try {
      return await run();
    } on DioException catch (e) {
      final data = e.response?.data;
      final message = (data is Map && data['error'] != null)
          ? data['error'].toString()
          : e.message ?? 'Network error';
      throw ApiException(message, statusCode: e.response?.statusCode);
    }
  }
}
