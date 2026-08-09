import '../../../core/api/api_client.dart';
import '../../../models/admin_self.dart';

class AdminRepository {
  AdminRepository(this._api);
  final ApiClient _api;

  Future<AdminDashboardData> getDashboard() async {
    final res = await _api.get('/admin/dashboard');
    return AdminDashboardData.fromJson(res);
  }

  /// Read-only member roster (excludes trainer/admin staff accounts) for the
  /// mobile quick-glance list — full member management stays on the web panel.
  Future<List<AdminMemberSummary>> getMembers({String? search}) async {
    final res = await _api.get('/admin/members', query: {
      'pageSize': 50,
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
    });
    final members = (res['members'] as List<dynamic>? ?? [])
        .map((e) => AdminMemberSummary.fromJson(e as Map<String, dynamic>))
        .where((m) => m.role == 'MEMBER')
        .toList();
    return members;
  }

  /// Flattens each class's future schedules into individual upcoming
  /// sessions, sorted soonest-first.
  Future<List<AdminUpcomingClass>> getUpcomingClasses() async {
    final res = await _api.getList('/admin/classes');
    final now = DateTime.now();
    final items = <AdminUpcomingClass>[];

    for (final entry in res) {
      final gymClass = entry as Map<String, dynamic>;
      final trainerName = ((gymClass['trainer'] as Map<String, dynamic>?)?['user'] as Map<String, dynamic>?)?['name'] as String?;
      final schedules = gymClass['schedules'] as List<dynamic>? ?? [];

      for (final scheduleEntry in schedules) {
        final schedule = scheduleEntry as Map<String, dynamic>;
        final startsAt = DateTime.parse(schedule['startsAt'] as String);
        if (startsAt.isBefore(now)) continue;

        items.add(AdminUpcomingClass(
          className: gymClass['name'] as String,
          type: gymClass['type'] as String,
          trainerName: trainerName,
          startsAt: startsAt,
          endsAt: DateTime.parse(schedule['endsAt'] as String),
          capacity: gymClass['capacity'] as int,
          booked: ((schedule['_count'] as Map<String, dynamic>?)?['bookings'] as int?) ?? 0,
        ));
      }
    }

    items.sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return items;
  }
}
