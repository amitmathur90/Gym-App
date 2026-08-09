import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_drawer.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/gym_class.dart';
import '../providers/classes_providers.dart';

const _classTypes = [
  ('YOGA', 'Yoga'),
  ('ZUMBA', 'Zumba'),
  ('HIIT', 'HIIT'),
  ('CROSSFIT', 'CrossFit'),
  ('PILATES', 'Pilates'),
  ('SPIN', 'Spin'),
];

class ClassesHomeScreen extends ConsumerWidget {
  const ClassesHomeScreen({super.key});

  Future<void> _book(BuildContext context, WidgetRef ref, ClassSchedule schedule) async {
    try {
      await ref.read(classesRepositoryProvider).book(schedule.id);
      ref.invalidate(classSchedulesProvider);
      ref.invalidate(myClassBookingsProvider);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Booked ${schedule.className}!')));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Booking failed')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedType = ref.watch(classScheduleTypeProvider);
    final schedulesAsync = ref.watch(classSchedulesProvider);
    final formatter = DateFormat('EEE, MMM d · h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Classes'),
        actions: [
          IconButton(icon: const Icon(Icons.event_note), onPressed: () => context.push('/classes/bookings')),
        ],
      ),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              spacing: 8,
              children: [
                ChoiceChip(
                  label: const Text('All'),
                  selected: selectedType == null,
                  onSelected: (_) => ref.read(classScheduleTypeProvider.notifier).state = null,
                ),
                for (final (value, label) in _classTypes)
                  ChoiceChip(
                    label: Text(label),
                    selected: selectedType == value,
                    onSelected: (_) => ref.read(classScheduleTypeProvider.notifier).state = value,
                  ),
              ],
            ),
          ),
          Expanded(
            child: AsyncValueView<List<ClassSchedule>>(
              value: schedulesAsync,
              onRetry: () => ref.invalidate(classSchedulesProvider),
              data: (schedules) => schedules.isEmpty
                  ? const Center(child: Text('No upcoming classes match this filter.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: schedules.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final s = schedules[index];
                        return Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                              child: const Icon(Icons.self_improvement, color: AppColors.primary),
                            ),
                            title: Text(s.className),
                            subtitle: Text(
                              '${formatter.format(s.startsAt.toLocal())}'
                              '${s.trainerName != null ? ' · ${s.trainerName}' : ''}\n'
                              '${s.booked}/${s.capacity} booked',
                            ),
                            isThreeLine: true,
                            trailing: ElevatedButton(
                              onPressed: s.isFull ? null : () => _book(context, ref, s),
                              child: Text(s.isFull ? 'Full' : 'Book'),
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
