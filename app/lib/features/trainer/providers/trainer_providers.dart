import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../models/trainer_self.dart';

final trainerDashboardProvider = FutureProvider.autoDispose<TrainerDashboardData>((ref) {
  return ref.watch(trainerRepositoryProvider).getDashboard();
});

/// Which range the Sessions tab's schedule query is filtered to.
final trainerScheduleRangeProvider = StateProvider.autoDispose<String>((ref) => 'today');

final trainerScheduleProvider = FutureProvider.autoDispose<List<TrainerSessionItem>>((ref) {
  final range = ref.watch(trainerScheduleRangeProvider);
  return ref.watch(trainerRepositoryProvider).getSchedule(range: range);
});

/// Always today's schedule, independent of whatever range the Sessions tab
/// is currently filtered to — used for the Dashboard's schedule preview.
final trainerTodayScheduleProvider = FutureProvider.autoDispose<List<TrainerSessionItem>>((ref) {
  return ref.watch(trainerRepositoryProvider).getSchedule(range: 'today');
});

final trainerMembersProvider = FutureProvider.autoDispose<List<TrainerMemberCard>>((ref) {
  return ref.watch(trainerRepositoryProvider).getMembers();
});

final trainerAlertsProvider = FutureProvider.autoDispose<List<TrainerAlertItem>>((ref) {
  return ref.watch(trainerRepositoryProvider).getAlerts();
});

final trainerDietPlansProvider = FutureProvider.autoDispose<List<TrainerDietPlan>>((ref) {
  return ref.watch(trainerRepositoryProvider).getDietPlans();
});

final memberWaterProvider = FutureProvider.autoDispose.family<MemberWaterProgress, String>((ref, memberId) {
  return ref.watch(trainerRepositoryProvider).getMemberWater(memberId);
});
