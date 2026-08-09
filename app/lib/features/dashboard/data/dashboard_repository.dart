import '../../../core/api/api_client.dart';
import '../../../models/dashboard.dart';

class DashboardRepository {
  DashboardRepository(this._api);
  final ApiClient _api;

  Future<DashboardData> getDashboard() async {
    final res = await _api.get('/users/me/dashboard');
    return DashboardData.fromJson(res);
  }
}
