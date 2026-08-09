import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/trainer_directory.dart';
import '../../trainers/providers/member_trainers_providers.dart';

/// Reuses the same public /api/trainers list the member-facing trainer
/// directory uses — read-only here since trainer CRUD stays on the web
/// admin panel; this is just a quick-glance roster for the mobile app.
class AdminTrainersScreen extends ConsumerWidget {
  const AdminTrainersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trainersAsync = ref.watch(memberTrainersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Trainers')),
      body: AsyncValueView<List<TrainerListItem>>(
        value: trainersAsync,
        onRetry: () => ref.invalidate(memberTrainersProvider),
        data: (trainers) => trainers.isEmpty
            ? const Center(child: Text('No trainers yet.'))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: trainers.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final t = trainers[index];
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                        child: Text(
                          t.name.isNotEmpty ? t.name[0].toUpperCase() : '?',
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                        ),
                      ),
                      title: Text(t.name),
                      subtitle: Text(
                        [
                          if (t.qualification != null) t.qualification!,
                          if (t.experienceYears != null) '${t.experienceYears} yrs experience',
                          if (t.specialties.isNotEmpty) t.specialties.join(', '),
                        ].join(' · '),
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
