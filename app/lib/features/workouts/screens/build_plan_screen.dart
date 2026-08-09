import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/workout.dart';
import '../providers/workouts_providers.dart';

class _PlanExerciseDraft {
  final Exercise exercise;
  int sets = 3;
  int reps = 10;
  _PlanExerciseDraft({required this.exercise});
}

class BuildPlanScreen extends ConsumerStatefulWidget {
  const BuildPlanScreen({super.key, this.programId});
  final String? programId;

  @override
  ConsumerState<BuildPlanScreen> createState() => _BuildPlanScreenState();
}

class _BuildPlanScreenState extends ConsumerState<BuildPlanScreen> {
  final _nameController = TextEditingController(text: 'My workout');
  int _dayOfWeek = DateTime.now().weekday % 7;
  final List<_PlanExerciseDraft> _selected = [];
  bool _saving = false;

  static const _days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  Future<void> _save() async {
    if (_selected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add at least one exercise')));
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(workoutsRepositoryProvider).createPlan(
            name: _nameController.text.trim().isEmpty ? 'My workout' : _nameController.text.trim(),
            dayOfWeek: _dayOfWeek,
            programId: widget.programId,
            exercises: [
              for (final d in _selected) {'exerciseId': d.exercise.id, 'sets': d.sets, 'reps': d.reps},
            ],
          );
      ref.invalidate(myWorkoutPlansProvider);
      if (!mounted) return;
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not save plan')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final exercisesAsync = ref.watch(allExercisesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Build workout plan')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Plan name')),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              initialValue: _dayOfWeek,
              decoration: const InputDecoration(labelText: 'Day of week'),
              items: [for (int i = 0; i < 7; i++) DropdownMenuItem(value: i, child: Text(_days[i]))],
              onChanged: (v) => setState(() => _dayOfWeek = v ?? _dayOfWeek),
            ),
            const SizedBox(height: 16),
            Text('Exercises', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Expanded(
              child: exercisesAsync.when(
                data: (exercises) => ListView(
                  children: [
                    if (_selected.isNotEmpty) ...[
                      for (final draft in _selected)
                        Card(
                          child: ListTile(
                            title: Text(draft.exercise.name),
                            subtitle: Row(
                              children: [
                                _StepperField(
                                  label: 'sets',
                                  value: draft.sets,
                                  onChanged: (v) => setState(() => draft.sets = v),
                                ),
                                const SizedBox(width: 16),
                                _StepperField(
                                  label: 'reps',
                                  value: draft.reps,
                                  onChanged: (v) => setState(() => draft.reps = v),
                                ),
                              ],
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.remove_circle_outline, color: AppColors.danger),
                              onPressed: () => setState(() => _selected.remove(draft)),
                            ),
                          ),
                        ),
                      const Divider(),
                    ],
                    Text('Add exercise', style: Theme.of(context).textTheme.labelLarge),
                    for (final e in exercises)
                      if (!_selected.any((d) => d.exercise.id == e.id))
                        ListTile(
                          dense: true,
                          title: Text(e.name),
                          subtitle: Text(e.muscleGroup),
                          trailing: const Icon(Icons.add),
                          onTap: () => setState(() => _selected.add(_PlanExerciseDraft(exercise: e))),
                        ),
                  ],
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(child: Text('Could not load exercises')),
              ),
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.onPrimary))
                    : const Text('Save plan'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepperField extends StatelessWidget {
  const _StepperField({required this.label, required this.value, required this.onChanged});
  final String label;
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          iconSize: 18,
          onPressed: () => onChanged((value - 1).clamp(1, 50)),
          icon: const Icon(Icons.remove_circle_outline),
        ),
        Text('$value $label'),
        IconButton(
          iconSize: 18,
          onPressed: () => onChanged((value + 1).clamp(1, 50)),
          icon: const Icon(Icons.add_circle_outline),
        ),
      ],
    );
  }
}
