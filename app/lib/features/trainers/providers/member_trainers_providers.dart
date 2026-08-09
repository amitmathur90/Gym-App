import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../models/trainer_directory.dart';

final memberTrainersProvider = FutureProvider.autoDispose<List<TrainerListItem>>((ref) {
  return ref.watch(memberTrainersRepositoryProvider).getTrainers();
});

final myPtBookingsProvider = FutureProvider.autoDispose<List<PtBooking>>((ref) {
  return ref.watch(memberTrainersRepositoryProvider).getMyBookings();
});
