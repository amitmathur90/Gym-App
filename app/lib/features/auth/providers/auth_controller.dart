import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/token_storage.dart';
import '../../../core/providers/core_providers.dart';
import '../../../models/user.dart';
import '../data/auth_repository.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final AppUser? user;

  const AuthState({required this.status, this.user});

  const AuthState.unknown() : this(status: AuthStatus.unknown);
  const AuthState.unauthenticated() : this(status: AuthStatus.unauthenticated);
  const AuthState.authenticated(AppUser user) : this(status: AuthStatus.authenticated, user: user);
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository) : super(const AuthState.unknown()) {
    _restoreSession();
  }

  final AuthRepository _repository;

  Future<void> _restoreSession() async {
    final token = await TokenStorage.instance.readAccessToken();
    if (token == null) {
      state = const AuthState.unauthenticated();
      return;
    }
    try {
      final user = await _repository.currentUser();
      state = AuthState.authenticated(user);
    } catch (_) {
      await TokenStorage.instance.clear();
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> login(String email, String password) async {
    final user = await _repository.login(email: email, password: password);
    state = AuthState.authenticated(user);
  }

  Future<void> completeOtpLogin(AppUser user) async {
    state = AuthState.authenticated(user);
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState.unauthenticated();
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.watch(authRepositoryProvider));
});
