import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _loading = false;
  String? _info;
  String? _error;

  Future<void> _submit() async {
    if (!_emailController.text.contains('@')) {
      setState(() => _error = 'Enter a valid email');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final devToken = await ref.read(authRepositoryProvider).forgotPassword(_emailController.text.trim());
      if (!mounted) return;
      setState(() => _info = 'If that email is registered, a reset link has been sent.');
      if (devToken != null) {
        context.push('/reset-password?token=$devToken');
      }
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'Something went wrong');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Forgot Password', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              const Text(
                "Enter your email or phone and we'll send you a reset link.",
                style: TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email or Phone'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: AppColors.danger)),
              ],
              if (_info != null) ...[
                const SizedBox(height: 12),
                Text(_info!, style: const TextStyle(color: AppColors.primary)),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.onPrimary),
                      )
                    : const Text('Send Reset Link'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
