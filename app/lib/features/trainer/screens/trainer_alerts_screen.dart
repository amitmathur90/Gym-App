import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/trainer_self.dart';
import '../providers/trainer_providers.dart';
import '../widgets/trainer_drawer.dart';

const _alertIcons = {
  'NEW_MEMBER_ASSIGNED': Icons.person_add_alt,
  'WORKOUT_DUE': Icons.fitness_center,
  'DIET_DUE': Icons.restaurant_menu,
  'MEMBERSHIP_EXPIRING': Icons.hourglass_bottom,
  'BIRTHDAY_REMINDER': Icons.cake,
  'APPOINTMENT_REMINDER': Icons.event,
};

class TrainerAlertsScreen extends ConsumerWidget {
  const TrainerAlertsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alertsAsync = ref.watch(trainerAlertsProvider);
    final formatter = DateFormat('MMM d, h:mm a');

    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      drawer: const TrainerDrawer(),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(trainerAlertsProvider),
        child: AsyncValueView<List<TrainerAlertItem>>(
          value: alertsAsync,
          onRetry: () => ref.invalidate(trainerAlertsProvider),
          data: (alerts) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (alerts.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: Center(child: Text("You're all caught up.")),
                )
              else
                ...alerts.map(
                  (a) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Icon(_alertIcons[a.type] ?? Icons.notifications, color: AppColors.primary),
                      title: Text(a.message),
                      subtitle: Text(formatter.format(a.createdAt.toLocal())),
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              const Text(
                "This is a live activity feed computed from current data, not a persisted/pushed notification "
                "system — there's no background job scheduler or push infrastructure behind it yet.",
                style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
