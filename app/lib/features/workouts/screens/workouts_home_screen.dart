import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_drawer.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/workout.dart';
import '../providers/workouts_providers.dart';
import '../widgets/rest_timer_sheet.dart';

class WorkoutsHomeScreen extends StatelessWidget {
  const WorkoutsHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Workouts'),
          actions: [
            IconButton(icon: const Icon(Icons.menu_book), onPressed: () => context.push('/workouts/exercises')),
          ],
          bottom: const TabBar(tabs: [Tab(text: 'My Plans'), Tab(text: 'Programs')]),
        ),
        drawer: const AppDrawer(),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.push('/workouts/build'),
          icon: const Icon(Icons.add),
          label: const Text('New plan'),
        ),
        body: const TabBarView(children: [_MyPlansTab(), _ProgramsTab()]),
      ),
    );
  }
}

class _MyPlansTab extends ConsumerWidget {
  const _MyPlansTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(myWorkoutPlansProvider);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return AsyncValueView<List<WorkoutPlan>>(
      value: plansAsync,
      onRetry: () => ref.invalidate(myWorkoutPlansProvider),
      data: (plans) => plans.isEmpty
          ? const Center(child: Text('No workout plans yet. Tap "New plan" to build one.'))
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: plans.length,
              itemBuilder: (context, index) {
                final plan = plans[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ExpansionTile(
                    title: Text(plan.name),
                    subtitle: Text(days[plan.dayOfWeek] + (plan.program != null ? ' · ${plan.program!.name}' : '')),
                    children: [
                      for (final ex in plan.exercises)
                        ListTile(
                          title: Text(ex.exercise.name),
                          subtitle: Text('${ex.sets} sets × ${ex.reps} reps · rest ${ex.restSeconds}s'),
                          trailing: Wrap(
                            spacing: 4,
                            children: [
                              IconButton(
                                tooltip: 'Rest timer',
                                icon: const Icon(Icons.timer_outlined),
                                onPressed: () => showRestTimerSheet(context, seconds: ex.restSeconds),
                              ),
                              IconButton(
                                tooltip: 'Log completed set',
                                icon: const Icon(Icons.check_circle_outline, color: AppColors.primary),
                                onPressed: () async {
                                  try {
                                    await ref.read(workoutsRepositoryProvider).logSet(
                                          exerciseId: ex.exercise.id,
                                          setsCompleted: ex.sets,
                                          repsCompleted: ex.reps,
                                        );
                                    if (!context.mounted) return;
                                    ScaffoldMessenger.of(context)
                                        .showSnackBar(const SnackBar(content: Text('Logged!')));
                                  } catch (e) {
                                    if (!context.mounted) return;
                                    ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text(e is ApiException ? e.message : 'Could not log set')));
                                  }
                                },
                              ),
                            ],
                          ),
                        ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8, bottom: 8),
                        child: Align(
                          alignment: Alignment.centerRight,
                          child: TextButton.icon(
                            onPressed: () async {
                              await ref.read(workoutsRepositoryProvider).deletePlan(plan.id);
                              ref.invalidate(myWorkoutPlansProvider);
                            },
                            icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.danger),
                            label: const Text('Delete plan', style: TextStyle(color: AppColors.danger)),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

class _ProgramsTab extends ConsumerStatefulWidget {
  const _ProgramsTab();

  @override
  ConsumerState<_ProgramsTab> createState() => _ProgramsTabState();
}

class _ProgramsTabState extends ConsumerState<_ProgramsTab> {
  String? _level;

  @override
  Widget build(BuildContext context) {
    final programsAsync = ref.watch(workoutProgramsProvider(_level));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Wrap(
            spacing: 8,
            children: [
              ChoiceChip(label: const Text('All'), selected: _level == null, onSelected: (_) => setState(() => _level = null)),
              ChoiceChip(
                  label: const Text('Beginner'),
                  selected: _level == 'BEGINNER',
                  onSelected: (_) => setState(() => _level = 'BEGINNER')),
              ChoiceChip(
                  label: const Text('Intermediate'),
                  selected: _level == 'INTERMEDIATE',
                  onSelected: (_) => setState(() => _level = 'INTERMEDIATE')),
              ChoiceChip(
                  label: const Text('Advanced'),
                  selected: _level == 'ADVANCED',
                  onSelected: (_) => setState(() => _level = 'ADVANCED')),
            ],
          ),
        ),
        Expanded(
          child: AsyncValueView<List<WorkoutProgram>>(
            value: programsAsync,
            onRetry: () => ref.invalidate(workoutProgramsProvider(_level)),
            data: (programs) => ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
              itemCount: programs.length,
              itemBuilder: (context, index) {
                final program = programs[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: const Icon(Icons.local_fire_department, color: AppColors.primary),
                    title: Text(program.name),
                    subtitle: Text('${program.level} · ${program.durationWeeks} weeks'),
                    onTap: () => context.push('/workouts/build?programId=${program.id}'),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
