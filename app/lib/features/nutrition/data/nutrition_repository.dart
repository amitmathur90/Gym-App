import '../../../core/api/api_client.dart';
import '../../../models/nutrition.dart';

class NutritionRepository {
  NutritionRepository(this._api);
  final ApiClient _api;

  Future<List<FoodItem>> getFoods({String? mealType}) async {
    final list = await _api.getList('/nutrition/foods', query: mealType != null ? {'mealType': mealType} : null);
    return list.map((e) => FoodItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<NutritionSummary> getSummary({String? date}) async {
    final res = await _api.get('/nutrition/summary', query: date != null ? {'date': date} : null);
    return NutritionSummary.fromJson(res);
  }

  Future<MealLog> logMeal({required String foodItemId, required String mealType, double servings = 1}) async {
    final res = await _api.post('/nutrition/meals', data: {
      'foodItemId': foodItemId,
      'mealType': mealType,
      'servings': servings,
    });
    return MealLog.fromJson(res);
  }

  Future<void> deleteMeal(String id) => _api.delete('/nutrition/meals/$id');

  Future<NutritionGoal> logWater(int amountMl) async {
    final res = await _api.patch('/nutrition/water', data: {'amountMl': amountMl});
    return NutritionGoal.fromJson(res);
  }

  /// Last 7 days (oldest first, including today) of water intake in ml.
  Future<List<int>> getWeeklyWater() async {
    final list = await _api.getList('/nutrition/water/weekly');
    return list.map((e) => (e as Map<String, dynamic>)['waterLoggedMl'] as int).toList();
  }

  /// The member's most recently assigned diet plan, or null if none has
  /// been assigned by a trainer/admin yet.
  Future<DietPlan?> getDietPlan() async {
    final res = await _api.get('/nutrition/diet-plan');
    if (res.isEmpty || res['id'] == null) return null;
    return DietPlan.fromJson(res);
  }

  Future<NutritionGoal> updateTargets({
    int? targetCalories,
    int? targetCarbsG,
    int? targetProteinG,
    int? targetFatsG,
    int? targetWaterMl,
  }) async {
    final res = await _api.patch('/nutrition/targets', data: {
      if (targetCalories != null) 'targetCalories': targetCalories,
      if (targetCarbsG != null) 'targetCarbsG': targetCarbsG,
      if (targetProteinG != null) 'targetProteinG': targetProteinG,
      if (targetFatsG != null) 'targetFatsG': targetFatsG,
      if (targetWaterMl != null) 'targetWaterMl': targetWaterMl,
    });
    return NutritionGoal.fromJson(res);
  }
}
