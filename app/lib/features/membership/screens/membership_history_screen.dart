import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/membership.dart';
import '../providers/membership_providers.dart';

class MembershipHistoryScreen extends ConsumerWidget {
  const MembershipHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(membershipHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Membership history')),
      body: AsyncValueView<List<Membership>>(
        value: historyAsync,
        onRetry: () => ref.invalidate(membershipHistoryProvider),
        data: (history) => history.isEmpty
            ? const Center(child: Text('No membership history yet.'))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: history.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final m = history[index];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(m.plan?.name ?? 'Plan', style: Theme.of(context).textTheme.titleMedium),
                              _StatusChip(status: m.status),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${m.startDate.toLocal().toString().split(' ').first} → '
                            '${m.endDate.toLocal().toString().split(' ').first}',
                            style: const TextStyle(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final color = status == 'ACTIVE' ? AppColors.primary : AppColors.textSecondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
