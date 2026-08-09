import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/trainer_self.dart';
import '../providers/trainer_providers.dart';
import '../widgets/trainer_drawer.dart';

const _ranges = [
  ('today', 'Today'),
  ('tomorrow', 'Tomorrow'),
  ('week', 'This Week'),
];

class TrainerSessionsScreen extends ConsumerWidget {
  const TrainerSessionsScreen({super.key});

  Future<void> _updateStatus(BuildContext context, WidgetRef ref, TrainerSessionItem session, String status) async {
    try {
      await ref.read(trainerRepositoryProvider).updateSessionStatus(session.id, status);
      ref.invalidate(trainerScheduleProvider);
      ref.invalidate(trainerDashboardProvider);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not update session')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final range = ref.watch(trainerScheduleRangeProvider);
    final scheduleAsync = ref.watch(trainerScheduleProvider);
    final formatter = DateFormat('EEE, MMM d · h:mm a');

    return Scaffold(
      appBar: AppBar(title: const Text('Sessions')),
      drawer: const TrainerDrawer(),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              spacing: 8,
              children: [
                for (final (value, label) in _ranges)
                  ChoiceChip(
                    label: Text(label),
                    selected: range == value,
                    onSelected: (_) => ref.read(trainerScheduleRangeProvider.notifier).state = value,
                  ),
              ],
            ),
          ),
          Expanded(
            child: AsyncValueView<List<TrainerSessionItem>>(
              value: scheduleAsync,
              onRetry: () => ref.invalidate(trainerScheduleProvider),
              data: (sessions) => sessions.isEmpty
                  ? const Center(child: Text('No sessions in this range.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: sessions.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final s = sessions[index];
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(s.memberName, style: const TextStyle(fontWeight: FontWeight.w600)),
                                          Text(formatter.format(s.startTime.toLocal()),
                                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                          if (s.sessionType != null)
                                            Text(s.sessionType!, style: const TextStyle(fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                    _StatusChip(status: s.status),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  children: [
                                    if (s.status == 'UPCOMING')
                                      OutlinedButton(
                                        onPressed: () => _updateStatus(context, ref, s, 'IN_PROGRESS'),
                                        child: const Text('Start'),
                                      ),
                                    if (s.status == 'IN_PROGRESS')
                                      ElevatedButton(
                                        onPressed: () => _updateStatus(context, ref, s, 'COMPLETED'),
                                        child: const Text('Complete'),
                                      ),
                                    if (s.status == 'UPCOMING' || s.status == 'PENDING')
                                      TextButton(
                                        onPressed: () => _updateStatus(context, ref, s, 'CANCELLED'),
                                        style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                                        child: const Text('Cancel'),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;

  static const _colors = {
    'UPCOMING': AppColors.primary,
    'IN_PROGRESS': AppColors.warning,
    'COMPLETED': AppColors.primary,
    'PENDING': AppColors.textSecondary,
    'CANCELLED': AppColors.danger,
  };

  @override
  Widget build(BuildContext context) {
    final color = _colors[status] ?? AppColors.textSecondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700)),
    );
  }
}
