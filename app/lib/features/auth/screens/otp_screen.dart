import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/auth_controller.dart';
import '../widgets/otp_code_field.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.email, required this.purpose, this.devOtp});

  final String email;
  final String purpose;
  final String? devOtp;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  String _code = '';
  bool _loading = false;
  bool _resending = false;
  String? _error;
  String? _devOtp;

  @override
  void initState() {
    super.initState();
    _devOtp = widget.devOtp;
  }

  Future<void> _verify() async {
    if (_code.length != 6) {
      setState(() => _error = 'Enter the 6-digit code');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = await ref.read(authRepositoryProvider).verifyOtp(
            email: widget.email,
            code: _code,
            purpose: widget.purpose,
          );
      await ref.read(authControllerProvider.notifier).completeOtpLogin(user);
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'Verification failed');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    setState(() => _resending = true);
    try {
      final devOtp = await ref.read(authRepositoryProvider).resendOtp(email: widget.email, purpose: widget.purpose);
      setState(() => _devOtp = devOtp);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('A new code has been sent')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not resend code')));
    } finally {
      if (mounted) setState(() => _resending = false);
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
              Text('Enter OTP', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(
                'We sent a 6-digit code to ${widget.email}',
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              if (_devOtp != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    'Dev mode — no SMS/email provider configured. Your code is: $_devOtp',
                    style: const TextStyle(fontSize: 13, color: AppColors.warning),
                  ),
                ),
              ],
              const SizedBox(height: 28),
              OtpCodeField(length: 6, onChanged: (v) => setState(() => _code = v)),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(_error!, style: const TextStyle(color: AppColors.danger)),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _verify,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.onPrimary),
                      )
                    : const Text('Verify'),
              ),
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: _resending ? null : _resend,
                  child: Text(_resending ? 'Sending...' : "Didn't get a code? Resend"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
