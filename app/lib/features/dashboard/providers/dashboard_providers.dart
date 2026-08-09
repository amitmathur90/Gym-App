import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../models/dashboard.dart';
import '../../../models/workout.dart';

final dashboardProvider = FutureProvider.autoDispose<DashboardData>((ref) {
  return ref.watch(dashboardRepositoryProvider).getDashboard();
});

/// Sets completed per weekday (Mon..Sun) for the current week, used to draw
/// the progress chart on the dashboard.
final weeklySetsChartProvider = FutureProvider.autoDispose<List<int>>((ref) async {
  final now = DateTime.now();
  final startOfWeek = DateTime(now.year, now.month, now.day).subtract(Duration(days: now.weekday - 1));
  final logs = await ref.watch(workoutsRepositoryProvider).getLogs(from: startOfWeek);

  final byDay = List<int>.filled(7, 0);
  for (final WorkoutLog log in logs) {
    final dayIndex = log.completedAt.weekday - 1;
    if (dayIndex >= 0 && dayIndex < 7) byDay[dayIndex] += log.setsCompleted;
  }
  return byDay;
});
