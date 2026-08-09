import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_exception.dart';
import '../theme/app_theme.dart';

/// Renders an [AsyncValue] with consistent loading/error UI so screens don't
/// each reimplement the same three branches.
class AsyncValueView<T> extends StatelessWidget {
  const AsyncValueView({
    super.key,
    required this.value,
    required this.data,
    this.onRetry,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: data,
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 40, color: AppColors.danger),
              const SizedBox(height: 12),
              Text(
                error is ApiException ? error.message : 'Something went wrong',
                textAlign: TextAlign.center,
              ),
              if (onRetry != null) ...[
                const SizedBox(height: 16),
                OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
