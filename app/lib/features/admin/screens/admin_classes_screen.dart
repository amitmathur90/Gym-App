import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/admin_self.dart';
import '../providers/admin_providers.dart';
import '../widgets/admin_drawer.dart';

class AdminClassesScreen extends ConsumerWidget {
  const AdminClassesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final classesAsync = ref.watch(adminUpcomingClassesProvider);
    final formatter = DateFormat('EEE, MMM d · h:mm a');

    return Scaffold(
      appBar: AppBar(title: const Text('Upcoming Classes')),
      drawer: const AdminDrawer(),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(adminUpcomingClassesProvider),
        child: AsyncValueView<List<AdminUpcomingClass>>(
          value: classesAsync,
          onRetry: () => ref.invalidate(adminUpcomingClassesProvider),
          data: (classes) => classes.isEmpty
              ? ListView(
                  children: const [
                    Padding(
                      padding: EdgeInsets.all(32),
                      child: Text('No upcoming classes scheduled.', textAlign: TextAlign.center),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: classes.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final c = classes[index];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                          child: const Icon(Icons.self_improvement, color: AppColors.primary),
                        ),
                        title: Text(c.className),
                        subtitle: Text(
                          '${formatter.format(c.startsAt.toLocal())}'
                          '${c.trainerName != null ? ' · ${c.trainerName}' : ''}\n'
                          '${c.booked}/${c.capacity} booked',
                        ),
                        isThreeLine: true,
                        trailing: c.isFull
                            ? const Text('Full', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600))
                            : null,
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
