import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../models/nutrition.dart';

final nutritionSummaryProvider = FutureProvider.autoDispose<NutritionSummary>((ref) {
  return ref.watch(nutritionRepositoryProvider).getSummary();
});

final foodCatalogProvider = FutureProvider.autoDispose.family<List<FoodItem>, String?>((ref, mealType) {
  return ref.watch(nutritionRepositoryProvider).getFoods(mealType: mealType);
});

final dietPlanProvider = FutureProvider.autoDispose<DietPlan?>((ref) {
  return ref.watch(nutritionRepositoryProvider).getDietPlan();
});

final weeklyWaterProvider = FutureProvider.autoDispose<List<int>>((ref) {
  return ref.watch(nutritionRepositoryProvider).getWeeklyWater();
});
