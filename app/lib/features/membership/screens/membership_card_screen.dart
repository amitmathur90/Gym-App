import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/membership.dart';
import '../providers/membership_providers.dart';

class MembershipCardScreen extends ConsumerWidget {
  const MembershipCardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cardAsync = ref.watch(membershipCardProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Digital membership card')),
      body: AsyncValueView<DigitalMembershipCard>(
        value: cardAsync,
        onRetry: () => ref.invalidate(membershipCardProvider),
        data: (card) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.fitness_center, color: Colors.white, size: 28),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    child: QrImageView(data: card.cardCode, size: 180),
                  ),
                  const SizedBox(height: 20),
                  Text(card.memberName,
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(card.planName, style: const TextStyle(color: Colors.white70)),
                  const SizedBox(height: 12),
                  Text(
                    'Valid until ${card.validUntil.toLocal().toString().split(' ').first}',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
