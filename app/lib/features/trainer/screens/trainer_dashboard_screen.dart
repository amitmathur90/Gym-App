import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/trainer_self.dart';
import '../../auth/providers/auth_controller.dart';
import '../providers/trainer_providers.dart';
import '../widgets/trainer_drawer.dart';

class TrainerDashboardScreen extends ConsumerWidget {
  const TrainerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final dashboardAsync = ref.watch(trainerDashboardProvider);
    final scheduleAsync = ref.watch(trainerTodayScheduleProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Trainer Dashboard')),
      drawer: const TrainerDrawer(),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(trainerDashboardProvider);
            ref.invalidate(trainerTodayScheduleProvider);
          },
          child: AsyncValueView<TrainerDashboardData>(
            value: dashboardAsync,
            onRetry: () => ref.invalidate(trainerDashboardProvider),
            data: (dashboard) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Hello, ${(user?.name ?? 'Coach').split(' ').first} 👋',
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                const Text('Here’s what’s on today.', style: TextStyle(color: AppColors.textSecondary)),
                const SizedBox(height: 20),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.6,
                  children: [
                    _StatTile(
                      icon: Icons.people,
                      value: '${dashboard.totalAssignedMembers}',
                      label: 'Assigned Members',
                      onTap: () => context.go('/trainer/members'),
                    ),
                    _StatTile(
                      icon: Icons.fitness_center,
                      value: '${dashboard.todaysSessions}',
                      label: "Today's Sessions",
                      onTap: () => context.go('/trainer/sessions'),
                    ),
                    _StatTile(
                      icon: Icons.event,
                      value: '${dashboard.upcomingSessions}',
                      label: 'Upcoming (7d)',
                      onTap: () => context.go('/trainer/sessions'),
                    ),
                    _StatTile(icon: Icons.hourglass_empty, value: '${dashboard.pendingWorkoutPlans}', label: 'Pending Plans'),
                    _StatTile(
                      icon: Icons.check_circle,
                      value: '${dashboard.completedSessionsToday}',
                      label: 'Completed Today',
                      onTap: () => context.go('/trainer/sessions'),
                    ),
                    _StatTile(icon: Icons.chat_bubble, value: '${dashboard.unreadMessages}', label: 'Unread Messages'),
                    _StatTile(
                      icon: Icons.star,
                      value: dashboard.averageRating != null ? dashboard.averageRating!.toStringAsFixed(1) : 'N/A',
                      label: 'Avg. Rating',
                    ),
                    _StatTile(icon: Icons.trending_up, value: '${dashboard.newAssignmentsThisMonth}', label: 'New This Month'),
                  ],
                ),
                const SizedBox(height: 20),
                Text("Today's Schedule", style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                AsyncValueView<List<TrainerSessionItem>>(
                  value: scheduleAsync,
                  onRetry: () => ref.invalidate(trainerTodayScheduleProvider),
                  data: (sessions) => sessions.isEmpty
                      ? const Card(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: Text('Nothing scheduled today.'),
                          ),
                        )
                      : Column(
                          children: sessions
                              .map((s) => Card(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    child: ListTile(
                                      leading: const Icon(Icons.schedule, color: AppColors.primary),
                                      title: Text(s.memberName),
                                      subtitle: Text(
                                        '${DateFormat('h:mm a').format(s.startTime.toLocal())} · ${s.sessionType ?? 'Session'}',
                                      ),
                                      trailing: _StatusBadge(status: s.status),
                                    ),
                                  ))
                              .toList(),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.icon, required this.value, required this.label, this.onTap});
  final IconData icon;
  final String value;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppColors.primary, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(value, style: Theme.of(context).textTheme.titleLarge),
                    Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              if (onTap != null) const Icon(Icons.chevron_right, color: AppColors.textSecondary, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
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
