import '../../../core/api/api_client.dart';
import '../../../models/gym_class.dart';

class ClassesRepository {
  ClassesRepository(this._api);
  final ApiClient _api;

  Future<List<GymClass>> getClasses({String? type}) async {
    final list = await _api.getList('/classes', query: type != null ? {'type': type} : null);
    return list.map((e) => GymClass.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ClassSchedule>> getSchedules({String? classId, DateTime? from, DateTime? to}) async {
    final list = await _api.getList('/classes/schedules', query: {
      if (classId != null) 'classId': classId,
      if (from != null) 'from': from.toUtc().toIso8601String(),
      if (to != null) 'to': to.toUtc().toIso8601String(),
    });
    return list.map((e) => ClassSchedule.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> book(String scheduleId) => _api.post('/classes/schedules/$scheduleId/book');

  Future<void> cancel(String bookingId) => _api.post('/classes/bookings/$bookingId/cancel');

  Future<List<ClassBooking>> myBookings() async {
    final list = await _api.getList('/classes/bookings/me');
    return list.map((e) => ClassBooking.fromJson(e as Map<String, dynamic>)).toList();
  }
}
