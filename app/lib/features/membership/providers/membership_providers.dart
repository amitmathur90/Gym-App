import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../models/membership.dart';

final membershipPlansProvider = FutureProvider.autoDispose<List<MembershipPlan>>((ref) {
  return ref.watch(membershipRepositoryProvider).getPlans();
});

final membershipHistoryProvider = FutureProvider.autoDispose<List<Membership>>((ref) {
  return ref.watch(membershipRepositoryProvider).history();
});

final activeMembershipProvider = FutureProvider.autoDispose<Membership?>((ref) async {
  final history = await ref.watch(membershipHistoryProvider.future);
  for (final m in history) {
    if (m.status == 'ACTIVE') return m;
  }
  return null;
});

final membershipCardProvider = FutureProvider.autoDispose<DigitalMembershipCard>((ref) {
  return ref.watch(membershipRepositoryProvider).card();
});
