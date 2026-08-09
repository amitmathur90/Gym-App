class FoodItem {
  final String id;
  final String name;
  final String mealType;
  final int calories;
  final double carbsG;
  final double proteinG;
  final double fatsG;
  final String servingLabel;

  FoodItem({
    required this.id,
    required this.name,
    required this.mealType,
    required this.calories,
    required this.carbsG,
    required this.proteinG,
    required this.fatsG,
    required this.servingLabel,
  });

  factory FoodItem.fromJson(Map<String, dynamic> json) => FoodItem(
        id: json['id'] as String,
        name: json['name'] as String,
        mealType: json['mealType'] as String,
        calories: json['calories'] as int,
        carbsG: double.parse(json['carbsG'].toString()),
        proteinG: double.parse(json['proteinG'].toString()),
        fatsG: double.parse(json['fatsG'].toString()),
        servingLabel: json['servingLabel'] as String,
      );
}

class MealLog {
  final String id;
  final FoodItem foodItem;
  final String mealType;
  final double servings;
  final DateTime loggedAt;

  MealLog({
    required this.id,
    required this.foodItem,
    required this.mealType,
    required this.servings,
    required this.loggedAt,
  });

  factory MealLog.fromJson(Map<String, dynamic> json) => MealLog(
        id: json['id'] as String,
        foodItem: FoodItem.fromJson(json['foodItem'] as Map<String, dynamic>),
        mealType: json['mealType'] as String,
        servings: double.parse(json['servings'].toString()),
        loggedAt: DateTime.parse(json['loggedAt'] as String),
      );
}

class NutritionGoal {
  final int? targetCalories;
  final int? targetWaterMl;
  final int? targetCarbsG;
  final int? targetProteinG;
  final int? targetFatsG;
  final int caloriesLogged;
  final int waterLoggedMl;
  final int carbsLoggedG;
  final int proteinLoggedG;
  final int fatsLoggedG;

  NutritionGoal({
    this.targetCalories,
    this.targetWaterMl,
    this.targetCarbsG,
    this.targetProteinG,
    this.targetFatsG,
    required this.caloriesLogged,
    required this.waterLoggedMl,
    required this.carbsLoggedG,
    required this.proteinLoggedG,
    required this.fatsLoggedG,
  });

  factory NutritionGoal.fromJson(Map<String, dynamic> json) => NutritionGoal(
        targetCalories: json['targetCalories'] as int?,
        targetWaterMl: json['targetWaterMl'] as int?,
        targetCarbsG: json['targetCarbsG'] as int?,
        targetProteinG: json['targetProteinG'] as int?,
        targetFatsG: json['targetFatsG'] as int?,
        caloriesLogged: json['caloriesLogged'] as int? ?? 0,
        waterLoggedMl: json['waterLoggedMl'] as int? ?? 0,
        carbsLoggedG: json['carbsLoggedG'] as int? ?? 0,
        proteinLoggedG: json['proteinLoggedG'] as int? ?? 0,
        fatsLoggedG: json['fatsLoggedG'] as int? ?? 0,
      );
}

class NutritionSummary {
  final NutritionGoal goal;
  final List<MealLog> meals;

  NutritionSummary({required this.goal, required this.meals});

  factory NutritionSummary.fromJson(Map<String, dynamic> json) => NutritionSummary(
        goal: NutritionGoal.fromJson(json['goal'] as Map<String, dynamic>),
        meals: (json['meals'] as List<dynamic>? ?? [])
            .map((e) => MealLog.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class DietPlanMealEntry {
  final String id;
  final FoodItem foodItem;
  final String mealType;
  final int dayOfWeek;
  final String? notes;

  DietPlanMealEntry({
    required this.id,
    required this.foodItem,
    required this.mealType,
    required this.dayOfWeek,
    this.notes,
  });

  factory DietPlanMealEntry.fromJson(Map<String, dynamic> json) => DietPlanMealEntry(
        id: json['id'] as String,
        foodItem: FoodItem.fromJson(json['foodItem'] as Map<String, dynamic>),
        mealType: json['mealType'] as String,
        dayOfWeek: json['dayOfWeek'] as int,
        notes: json['notes'] as String?,
      );
}

/// A structured diet plan assigned to the member by a trainer/admin —
/// distinct from the member's own free-form meal logging.
class DietPlan {
  final String id;
  final String name;
  final String? notes;
  final String? trainerName;
  final List<DietPlanMealEntry> meals;

  DietPlan({required this.id, required this.name, this.notes, this.trainerName, required this.meals});

  factory DietPlan.fromJson(Map<String, dynamic> json) => DietPlan(
        id: json['id'] as String,
        name: json['name'] as String,
        notes: json['notes'] as String?,
        trainerName: json['trainer']?['user']?['name'] as String?,
        meals: (json['meals'] as List<dynamic>? ?? [])
            .map((e) => DietPlanMealEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
