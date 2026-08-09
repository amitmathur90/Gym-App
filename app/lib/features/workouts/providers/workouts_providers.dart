import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../models/workout.dart';

final myWorkoutPlansProvider = FutureProvider.autoDispose<List<WorkoutPlan>>((ref) {
  return ref.watch(workoutsRepositoryProvider).getMyPlans();
});

final workoutProgramsProvider = FutureProvider.autoDispose.family<List<WorkoutProgram>, String?>((ref, level) {
  return ref.watch(workoutsRepositoryProvider).getPrograms(level: level);
});

final exerciseLibraryProvider = FutureProvider.autoDispose.family<List<Exercise>, String?>((ref, muscleGroup) {
  return ref.watch(workoutsRepositoryProvider).getExercises(muscleGroup: muscleGroup);
});

final allExercisesProvider = FutureProvider.autoDispose<List<Exercise>>((ref) {
  return ref.watch(workoutsRepositoryProvider).getExercises();
});
