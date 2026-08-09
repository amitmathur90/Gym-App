import '../../../core/api/api_client.dart';
import '../../../core/api/token_storage.dart';
import '../../../models/user.dart';

class OtpRequiredException implements Exception {
  final String email;
  final String? devOtp;
  OtpRequiredException(this.email, this.devOtp);
}

class AuthRepository {
  AuthRepository(this._api);
  final ApiClient _api;

  Future<String?> signup({
    required String name,
    required String email,
    String? phone,
    required String password,
  }) async {
    final res = await _api.post('/auth/signup', data: {
      'name': name,
      'email': email,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      'password': password,
    });
    return res['devOtp'] as String?;
  }

  /// Returns the authenticated [AppUser] on success. Throws
  /// [OtpRequiredException] if the account still needs OTP verification.
  Future<AppUser> login({required String email, required String password}) async {
    final res = await _api.post('/auth/login', data: {'email': email, 'password': password});
    if (res['requiresVerification'] == true) {
      throw OtpRequiredException(email, res['devOtp'] as String?);
    }
    await TokenStorage.instance.save(
      accessToken: res['accessToken'] as String,
      refreshToken: res['refreshToken'] as String,
    );
    return AppUser.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<AppUser> verifyOtp({required String email, required String code, required String purpose}) async {
    final res = await _api.post('/auth/otp/verify', data: {'email': email, 'code': code, 'purpose': purpose});
    await TokenStorage.instance.save(
      accessToken: res['accessToken'] as String,
      refreshToken: res['refreshToken'] as String,
    );
    return AppUser.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<String?> resendOtp({required String email, required String purpose}) async {
    final res = await _api.post('/auth/otp/resend', data: {'email': email, 'purpose': purpose});
    return res['devOtp'] as String?;
  }

  Future<String?> forgotPassword(String email) async {
    final res = await _api.post('/auth/password/forgot', data: {'email': email});
    return res['devToken'] as String?;
  }

  Future<void> resetPassword({required String token, required String newPassword}) async {
    await _api.post('/auth/password/reset', data: {'token': token, 'newPassword': newPassword});
  }

  Future<AppUser> socialLogin({required String provider, required String idToken, String? name, String? email}) async {
    final res = await _api.post('/auth/social', data: {
      'provider': provider,
      'idToken': idToken,
      if (name != null) 'name': name,
      if (email != null) 'email': email,
    });
    await TokenStorage.instance.save(
      accessToken: res['accessToken'] as String,
      refreshToken: res['refreshToken'] as String,
    );
    return AppUser.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<AppUser> currentUser() async {
    final res = await _api.get('/users/me');
    return AppUser.fromJson(res);
  }

  Future<void> logout() => TokenStorage.instance.clear();
}
