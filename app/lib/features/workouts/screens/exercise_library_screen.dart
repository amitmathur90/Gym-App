import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/workout.dart';
import '../providers/workouts_providers.dart';

class ExerciseLibraryScreen extends ConsumerStatefulWidget {
  const ExerciseLibraryScreen({super.key});

  @override
  ConsumerState<ExerciseLibraryScreen> createState() => _ExerciseLibraryScreenState();
}

class _ExerciseLibraryScreenState extends ConsumerState<ExerciseLibraryScreen> {
  String? _muscleGroup;

  static const _groups = ['Chest', 'Back', 'Legs', 'Core'];

  @override
  Widget build(BuildContext context) {
    final exercisesAsync = ref.watch(exerciseLibraryProvider(_muscleGroup));

    return Scaffold(
      appBar: AppBar(title: const Text('Exercise library')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              spacing: 8,
              children: [
                ChoiceChip(label: const Text('All'), selected: _muscleGroup == null, onSelected: (_) => setState(() => _muscleGroup = null)),
                for (final g in _groups)
                  ChoiceChip(label: Text(g), selected: _muscleGroup == g, onSelected: (_) => setState(() => _muscleGroup = g)),
              ],
            ),
          ),
          Expanded(
            child: AsyncValueView<List<Exercise>>(
              value: exercisesAsync,
              onRetry: () => ref.invalidate(exerciseLibraryProvider(_muscleGroup)),
              data: (exercises) => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: exercises.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final e = exercises[index];
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                        child: const Icon(Icons.fitness_center, color: AppColors.primary),
                      ),
                      title: Text(e.name),
                      subtitle: Text('${e.muscleGroup}${e.equipment != null ? ' · ${e.equipment}' : ''}'),
                      trailing: e.videoUrl != null ? const Icon(Icons.play_circle_outline) : null,
                      onTap: () => _showDetail(context, e),
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

  void _showDetail(BuildContext context, Exercise e) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(e.name, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text('${e.muscleGroup}${e.equipment != null ? ' · ${e.equipment}' : ''}'),
              const SizedBox(height: 12),
              if (e.videoUrl != null)
                Container(
                  height: 160,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.play_circle_fill, color: Colors.white, size: 48),
                )
              else
                const Text('No video demonstration uploaded yet.', style: TextStyle(color: AppColors.textSecondary)),
              if (e.description != null) ...[
                const SizedBox(height: 12),
                Text(e.description!),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
