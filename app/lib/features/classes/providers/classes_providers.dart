import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../models/gym_class.dart';

final classScheduleTypeProvider = StateProvider<String?>((ref) => null);

final classSchedulesProvider = FutureProvider.autoDispose<List<ClassSchedule>>((ref) async {
  final type = ref.watch(classScheduleTypeProvider);
  final classesRepo = ref.watch(classesRepositoryProvider);
  final schedules = await classesRepo.getSchedules();
  if (type == null) return schedules;
  return schedules.where((s) => s.type == type).toList();
});

final myClassBookingsProvider = FutureProvider.autoDispose<List<ClassBooking>>((ref) {
  return ref.watch(classesRepositoryProvider).myBookings();
});
