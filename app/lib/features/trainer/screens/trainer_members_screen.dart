import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/trainer_self.dart';
import '../providers/trainer_providers.dart';
import '../widgets/trainer_drawer.dart';

class TrainerMembersScreen extends ConsumerWidget {
  const TrainerMembersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(trainerMembersProvider);
    final dateFormat = DateFormat('MMM d');

    return Scaffold(
      appBar: AppBar(title: const Text('My Members')),
      drawer: const TrainerDrawer(),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(trainerMembersProvider),
        child: AsyncValueView<List<TrainerMemberCard>>(
          value: membersAsync,
          onRetry: () => ref.invalidate(trainerMembersProvider),
          data: (members) => members.isEmpty
              ? ListView(
                  children: const [
                    Padding(
                      padding: EdgeInsets.all(32),
                      child: Text(
                        'No members assigned yet — the admin panel assigns members to trainers.',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: members.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final m = members[index];
                    return Card(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () => context.push('/trainer/members/${m.id}'),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                                    child: Text(
                                      m.name.isNotEmpty ? m.name[0].toUpperCase() : '?',
                                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(m.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                        Text(m.membershipPlan ?? 'No active membership',
                                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                      ],
                                    ),
                                  ),
                                  const Icon(Icons.chevron_right, color: AppColors.textSecondary),
                                ],
                              ),
                              const SizedBox(height: 12),
                              _InfoRow(label: 'Goal', value: m.goal ?? '—'),
                              _InfoRow(label: 'Last visit', value: m.lastVisit != null ? dateFormat.format(m.lastVisit!.toLocal()) : '—'),
                              _InfoRow(
                                label: 'Next session',
                                value: m.nextSession != null ? dateFormat.format(m.nextSession!.toLocal()) : '—',
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  const Text('Weekly consistency', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                  const Spacer(),
                                  Text('${m.weeklyConsistencyPct}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child: LinearProgressIndicator(
                                  value: m.weeklyConsistencyPct / 100,
                                  minHeight: 6,
                                  backgroundColor: AppColors.divider,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
