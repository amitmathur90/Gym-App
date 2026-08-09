import '../../../core/api/api_client.dart';
import '../../../models/trainer_directory.dart';

/// Member-facing "browse trainers and book a session" repository, backed by
/// the public /api/trainers routes (open trainer list + self-service
/// booking with ANY trainer — separate from `assignedTrainerId`, which is
/// admin-managed and only affects the chat thread in MessagesRepository).
class MemberTrainersRepository {
  MemberTrainersRepository(this._api);
  final ApiClient _api;

  Future<List<TrainerListItem>> getTrainers() async {
    final res = await _api.getList('/trainers');
    return res.map((e) => TrainerListItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> bookTrainer({
    required String trainerId,
    required DateTime start,
    required DateTime end,
    String? sessionType,
  }) async {
    await _api.post('/trainers/$trainerId/book', data: {
      'startTime': start.toUtc().toIso8601String(),
      'endTime': end.toUtc().toIso8601String(),
      if (sessionType != null) 'sessionType': sessionType,
    });
  }

  Future<List<PtBooking>> getMyBookings() async {
    final res = await _api.getList('/trainers/bookings/me');
    return res.map((e) => PtBooking.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> cancelBooking(String id) async {
    await _api.patch('/trainers/bookings/$id/cancel');
  }
}
