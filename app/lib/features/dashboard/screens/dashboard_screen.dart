import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_drawer.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/dashboard.dart';
import '../../../models/membership.dart';
import '../../auth/providers/auth_controller.dart';
import '../providers/dashboard_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final dashboardAsync = ref.watch(dashboardProvider);

    return Scaffold(
      appBar: AppBar(),
      drawer: const AppDrawer(),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.refresh(dashboardProvider),
          child: AsyncValueView<DashboardData>(
            value: dashboardAsync,
            onRetry: () => ref.invalidate(dashboardProvider),
            data: (dashboard) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _GreetingHeader(name: user?.name),
                const SizedBox(height: 20),
                _StatsRow(summary: dashboard.workoutSummary, goal: dashboard.dailyGoal),
                const SizedBox(height: 16),
                _MembershipStatusCard(status: dashboard.membershipStatus),
                const SizedBox(height: 16),
                const _QuickAccessCard(
                  icon: Icons.restaurant_menu,
                  title: 'Diet & Nutrition',
                  subtitle: 'Meal plans, calories, macros & more',
                  route: '/nutrition',
                ),
                const SizedBox(height: 10),
                const _QuickAccessCard(
                  icon: Icons.fitness_center,
                  title: 'Personal Training',
                  subtitle: 'Browse trainers & book a session',
                  route: '/trainers',
                ),
                const SizedBox(height: 10),
                const _QuickAccessCard(
                  icon: Icons.chat_bubble_outline,
                  title: 'Messages',
                  subtitle: 'Chat with your trainer',
                  route: '/messages',
                ),
                const SizedBox(height: 16),
                _DailyGoalsCard(goal: dashboard.dailyGoal),
                const SizedBox(height: 16),
                const _WeeklyProgressChart(),
                const SizedBox(height: 16),
                _UpcomingClassesCard(classes: dashboard.upcomingClasses),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GreetingHeader extends StatelessWidget {
  const _GreetingHeader({required this.name});
  final String? name;

  @override
  Widget build(BuildContext context) {
    final firstName = (name ?? 'Athlete').split(' ').first;
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Hello, $firstName 👋', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 4),
              const Text(
                'Ready to crush your goals today?',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
        CircleAvatar(
          radius: 24,
          backgroundColor: AppColors.primary.withValues(alpha: 0.15),
          child: Text(
            firstName.isNotEmpty ? firstName[0].toUpperCase() : '?',
            style: const TextStyle(fontSize: 18, color: AppColors.primary, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}

class _QuickAccessCard extends StatelessWidget {
  const _QuickAccessCard({required this.icon, required this.title, required this.subtitle, required this.route});
  final IconData icon;
  final String title;
  final String subtitle;
  final String route;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push(route),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.summary, required this.goal});
  final WorkoutSummary summary;
  final DailyGoalProgress goal;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatTile(
            icon: Icons.fitness_center,
            value: '${summary.sessionsThisWeek}',
            label: 'This Week',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatTile(
            icon: Icons.local_fire_department,
            value: '${goal.caloriesLogged}',
            label: 'kcal Today',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatTile(
            icon: Icons.timer,
            value: '${goal.workoutMinutesLogged}m',
            label: 'Active Time',
          ),
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.icon, required this.value, required this.label});
  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 22),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _MembershipStatusCard extends StatelessWidget {
  const _MembershipStatusCard({required this.status});
  final MembershipStatusSummary? status;

  @override
  Widget build(BuildContext context) {
    if (status == null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Expanded(child: Text('No active membership')),
              ElevatedButton(
                style: ElevatedButton.styleFrom(minimumSize: const Size(88, 40)),
                onPressed: () => context.go('/membership'),
                child: const Text('Get one'),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Colors.white24,
            child: Icon(Icons.card_membership, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(status!.planName,
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                Text('${status!.daysRemaining} days remaining', style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.go('/membership'),
            style: TextButton.styleFrom(foregroundColor: Colors.white),
            child: const Text('Manage'),
          ),
        ],
      ),
    );
  }
}

class _DailyGoalsCard extends StatelessWidget {
  const _DailyGoalsCard({required this.goal});
  final DailyGoalProgress goal;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Today's Goals", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _GoalRing(
                  icon: Icons.water_drop,
                  current: goal.waterLoggedMl,
                  target: goal.targetWaterMl ?? 2500,
                  label: 'Water (ml)',
                  onTap: () => context.push('/nutrition/water'),
                ),
                _GoalRing(
                  icon: Icons.local_fire_department,
                  current: goal.caloriesLogged,
                  target: goal.targetCalories ?? 2000,
                  label: 'Calories',
                  onTap: () => context.push('/nutrition'),
                ),
                _GoalRing(
                  icon: Icons.timer,
                  current: goal.workoutMinutesLogged,
                  target: goal.targetWorkoutMinutes ?? 45,
                  label: 'Workout',
                  onTap: () => context.go('/workouts'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _GoalRing extends StatelessWidget {
  const _GoalRing({
    required this.icon,
    required this.current,
    required this.target,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final int current;
  final int target;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final progress = target == 0 ? 0.0 : (current / target).clamp(0, 1).toDouble();
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Column(
          children: [
            SizedBox(
              width: 64,
              height: 64,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 64,
                    height: 64,
                    child: CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 6,
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                  Icon(icon, color: AppColors.primary, size: 22),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text('$current/$target', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}

class _WeeklyProgressChart extends ConsumerWidget {
  const _WeeklyProgressChart();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chartAsync = ref.watch(weeklySetsChartProvider);
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Progress this week', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            SizedBox(
              height: 140,
              child: chartAsync.when(
                data: (byDay) {
                  final maxY = (byDay.reduce((a, b) => a > b ? a : b)).toDouble();
                  return BarChart(
                    BarChartData(
                      maxY: maxY <= 0 ? 5 : maxY + 2,
                      gridData: const FlGridData(show: false),
                      borderData: FlBorderData(show: false),
                      titlesData: FlTitlesData(
                        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) => Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(days[value.toInt() % 7], style: const TextStyle(fontSize: 12)),
                            ),
                          ),
                        ),
                      ),
                      barGroups: [
                        for (int i = 0; i < 7; i++)
                          BarChartGroupData(x: i, barRods: [
                            BarChartRodData(
                              toY: byDay[i].toDouble(),
                              color: AppColors.primary,
                              width: 18,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ]),
                      ],
                    ),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(child: Text('Could not load chart')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UpcomingClassesCard extends StatelessWidget {
  const _UpcomingClassesCard({required this.classes});
  final List<UpcomingClass> classes;

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('EEE, MMM d · h:mm a');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Upcoming classes', style: Theme.of(context).textTheme.titleMedium),
                TextButton(onPressed: () => context.go('/classes'), child: const Text('Book more')),
              ],
            ),
            if (classes.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text('No upcoming classes booked yet.'),
              )
            else
              ...classes.map(
                (c) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      const Icon(Icons.event_available, size: 18, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Expanded(child: Text(c.className)),
                      Text(formatter.format(c.startsAt.toLocal()), style: const TextStyle(fontSize: 12)),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
