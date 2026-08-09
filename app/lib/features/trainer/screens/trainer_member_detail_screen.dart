import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/trainer_self.dart';
import '../providers/trainer_providers.dart';

class TrainerMemberDetailScreen extends ConsumerWidget {
  const TrainerMemberDetailScreen({super.key, required this.memberId});
  final String memberId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(trainerMembersProvider);
    final waterAsync = ref.watch(memberWaterProvider(memberId));

    return Scaffold(
      appBar: AppBar(title: const Text('Member Progress')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(memberWaterProvider(memberId)),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            membersAsync.when(
              data: (members) {
                TrainerMemberCard? member;
                for (final m in members) {
                  if (m.id == memberId) {
                    member = m;
                    break;
                  }
                }
                if (member == null) return const SizedBox.shrink();
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                          child: Text(
                            member.name.isNotEmpty ? member.name[0].toUpperCase() : '?',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(member.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                              Text(member.email, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                              if (member.goal != null) Text(member.goal!, style: const TextStyle(fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 16),
            Text('Water Intake', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            AsyncValueView<MemberWaterProgress>(
              value: waterAsync,
              onRetry: () => ref.invalidate(memberWaterProvider(memberId)),
              data: (water) {
                final progress = water.targetWaterMl == 0 ? 0.0 : (water.todayWaterMl / water.targetWaterMl).clamp(0, 1).toDouble();
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.water_drop, color: AppColors.primary),
                            const SizedBox(width: 8),
                            Text(
                              '${(water.todayWaterMl / 1000).toStringAsFixed(1)}L of ${(water.targetWaterMl / 1000).toStringAsFixed(1)}L today',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(value: progress, minHeight: 8, backgroundColor: AppColors.divider),
                        ),
                        const SizedBox(height: 16),
                        const Text('Last 7 days', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 80,
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              for (final ml in water.weeklyMl)
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 3),
                                    child: FractionallySizedBox(
                                      heightFactor: water.targetWaterMl == 0 ? 0 : (ml / water.targetWaterMl).clamp(0.03, 1).toDouble(),
                                      alignment: Alignment.bottomCenter,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: AppColors.primary.withValues(alpha: 0.7),
                                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),
            const Text(
              "This shows what the member has already logged themselves — trainers can't log water on a member's behalf.",
              style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}
