import '../../../core/api/api_client.dart';
import '../../../models/workout.dart';

class WorkoutsRepository {
  WorkoutsRepository(this._api);
  final ApiClient _api;

  Future<List<WorkoutProgram>> getPrograms({String? level}) async {
    final list = await _api.getList('/workouts/programs', query: level != null ? {'level': level} : null);
    return list.map((e) => WorkoutProgram.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Exercise>> getExercises({String? muscleGroup}) async {
    final list =
        await _api.getList('/workouts/exercises', query: muscleGroup != null ? {'muscleGroup': muscleGroup} : null);
    return list.map((e) => Exercise.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<WorkoutPlan>> getMyPlans() async {
    final list = await _api.getList('/workouts/plans');
    return list.map((e) => WorkoutPlan.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<WorkoutPlan> createPlan({
    required String name,
    required int dayOfWeek,
    String? programId,
    required List<Map<String, dynamic>> exercises,
  }) async {
    final res = await _api.post('/workouts/plans', data: {
      'name': name,
      'dayOfWeek': dayOfWeek,
      if (programId != null) 'programId': programId,
      'exercises': exercises,
    });
    return WorkoutPlan.fromJson(res);
  }

  Future<void> deletePlan(String id) => _api.delete('/workouts/plans/$id');

  Future<WorkoutLog> logSet({
    required String exerciseId,
    required int setsCompleted,
    required int repsCompleted,
    double? weightKg,
  }) async {
    final res = await _api.post('/workouts/logs', data: {
      'exerciseId': exerciseId,
      'setsCompleted': setsCompleted,
      'repsCompleted': repsCompleted,
      if (weightKg != null) 'weightKg': weightKg,
    });
    return WorkoutLog.fromJson(res);
  }

  Future<List<WorkoutLog>> getLogs({DateTime? from, DateTime? to}) async {
    final list = await _api.getList('/workouts/logs', query: {
      if (from != null) 'from': from.toUtc().toIso8601String(),
      if (to != null) 'to': to.toUtc().toIso8601String(),
    });
    return list.map((e) => WorkoutLog.fromJson(e as Map<String, dynamic>)).toList();
  }
}
