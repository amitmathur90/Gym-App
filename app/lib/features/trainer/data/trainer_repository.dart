import '../../../core/api/api_client.dart';
import '../../../models/trainer_self.dart';

class TrainerRepository {
  TrainerRepository(this._api);
  final ApiClient _api;

  Future<TrainerDashboardData> getDashboard() async {
    final res = await _api.get('/trainer/dashboard');
    return TrainerDashboardData.fromJson(res);
  }

  Future<List<TrainerSessionItem>> getSchedule({String range = 'today'}) async {
    final res = await _api.getList('/trainer/schedule', query: {'range': range});
    return res.map((e) => TrainerSessionItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<TrainerMemberCard>> getMembers() async {
    final res = await _api.getList('/trainer/members');
    return res.map((e) => TrainerMemberCard.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<TrainerAlertItem>> getAlerts() async {
    final res = await _api.getList('/trainer/alerts');
    return res.map((e) => TrainerAlertItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> updateSessionStatus(String id, String status) async {
    await _api.patch('/trainer/sessions/$id', data: {'status': status});
  }

  Future<List<TrainerDietPlan>> getDietPlans() async {
    final res = await _api.getList('/trainer/diet-plans');
    return res.map((e) => TrainerDietPlan.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> createDietPlan({
    required String memberId,
    required String name,
    String? notes,
    int? targetWaterMl,
    String? supplements,
    required List<Map<String, dynamic>> meals,
  }) async {
    await _api.post('/trainer/diet-plans', data: {
      'memberId': memberId,
      'name': name,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
      if (targetWaterMl != null) 'targetWaterMl': targetWaterMl,
      if (supplements != null && supplements.isNotEmpty) 'supplements': supplements,
      'meals': meals,
    });
  }

  Future<void> deleteDietPlan(String id) => _api.delete('/trainer/diet-plans/$id');

  Future<MemberWaterProgress> getMemberWater(String memberId) async {
    final res = await _api.get('/trainer/members/$memberId/water');
    return MemberWaterProgress.fromJson(res);
  }
}
