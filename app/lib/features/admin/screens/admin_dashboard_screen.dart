import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/admin_self.dart';
import '../../auth/providers/auth_controller.dart';
import '../providers/admin_providers.dart';
import '../widgets/admin_drawer.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final dashboardAsync = ref.watch(adminDashboardProvider);
    final classesAsync = ref.watch(adminUpcomingClassesProvider);
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final dateFormat = DateFormat('EEE, MMM d · h:mm a');

    return Scaffold(
      appBar: AppBar(title: const Text('Admin Dashboard')),
      drawer: const AdminDrawer(),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(adminDashboardProvider);
            ref.invalidate(adminUpcomingClassesProvider);
          },
          child: AsyncValueView<AdminDashboardData>(
            value: dashboardAsync,
            onRetry: () => ref.invalidate(adminDashboardProvider),
            data: (dashboard) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Hello, ${(user?.name ?? 'Admin').split(' ').first} 👋',
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                const Text('Gym at a glance.', style: TextStyle(color: AppColors.textSecondary)),
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
                      value: '${dashboard.totalMembers}',
                      label: 'Total Members',
                      onTap: () => context.go('/admin/members'),
                    ),
                    _StatTile(
                      icon: Icons.card_membership,
                      value: '${dashboard.activeMemberships}',
                      label: 'Active Memberships',
                      onTap: () => context.go('/admin/members'),
                    ),
                    _StatTile(
                      icon: Icons.fitness_center,
                      value: '${dashboard.totalTrainers}',
                      label: 'Trainers',
                      onTap: () => context.push('/admin/home/trainers'),
                    ),
                    _StatTile(
                      icon: Icons.trending_up,
                      value: '${dashboard.newMembersThisMonth}',
                      label: 'New This Month',
                      onTap: () => context.go('/admin/members'),
                    ),
                    _StatTile(icon: Icons.payments, value: currency.format(dashboard.monthlyRevenue), label: 'Revenue This Month'),
                    _StatTile(icon: Icons.savings, value: currency.format(dashboard.totalRevenue), label: 'Total Revenue'),
                    _StatTile(
                      icon: Icons.event_available,
                      value: '${dashboard.upcomingClassesCount}',
                      label: 'Upcoming Classes',
                      onTap: () => context.go('/admin/classes'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text('Upcoming classes', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                AsyncValueView<List<AdminUpcomingClass>>(
                  value: classesAsync,
                  onRetry: () => ref.invalidate(adminUpcomingClassesProvider),
                  data: (classes) => classes.isEmpty
                      ? const Card(
                          child: Padding(padding: EdgeInsets.all(16), child: Text('No upcoming classes scheduled.')),
                        )
                      : Column(
                          children: classes
                              .take(5)
                              .map((c) => Card(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    child: ListTile(
                                      leading: const Icon(Icons.self_improvement, color: AppColors.primary),
                                      title: Text(c.className),
                                      subtitle: Text(
                                        '${dateFormat.format(c.startsAt.toLocal())}'
                                        '${c.trainerName != null ? ' · ${c.trainerName}' : ''}',
                                      ),
                                      trailing: Text('${c.booked}/${c.capacity}', style: const TextStyle(fontSize: 12)),
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
                    Text(value, style: Theme.of(context).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
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
