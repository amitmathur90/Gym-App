import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../models/admin_self.dart';

final adminDashboardProvider = FutureProvider.autoDispose<AdminDashboardData>((ref) {
  return ref.watch(adminRepositoryProvider).getDashboard();
});

final adminMemberSearchProvider = StateProvider.autoDispose<String>((ref) => '');

final adminMembersProvider = FutureProvider.autoDispose<List<AdminMemberSummary>>((ref) {
  final search = ref.watch(adminMemberSearchProvider);
  return ref.watch(adminRepositoryProvider).getMembers(search: search);
});

final adminUpcomingClassesProvider = FutureProvider.autoDispose<List<AdminUpcomingClass>>((ref) {
  return ref.watch(adminRepositoryProvider).getUpcomingClasses();
});
