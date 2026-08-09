import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/nutrition.dart';
import '../providers/nutrition_providers.dart';
import '../widgets/add_food_sheet.dart';

const _mealTypes = [
  ('BREAKFAST', 'Breakfast', Icons.free_breakfast),
  ('LUNCH', 'Lunch', Icons.lunch_dining),
  ('DINNER', 'Dinner', Icons.dinner_dining),
  ('SNACK', 'Snacks', Icons.cookie),
];

const _dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class NutritionHomeScreen extends ConsumerWidget {
  const NutritionHomeScreen({super.key});

  Future<void> _addFood(BuildContext context, WidgetRef ref, String mealType) async {
    final food = await showAddFoodSheet(context, ref, mealType);
    if (food == null) return;
    try {
      await ref.read(nutritionRepositoryProvider).logMeal(foodItemId: food.id, mealType: mealType);
      ref.invalidate(nutritionSummaryProvider);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Logged ${food.name}')));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not log meal')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(nutritionSummaryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Diet & Nutrition'),
        actions: [
          IconButton(
            tooltip: 'Calorie Calculator',
            icon: const Icon(Icons.calculate_outlined),
            onPressed: () => context.push('/nutrition/calorie-calculator'),
          ),
          IconButton(
            tooltip: 'BMI Calculator',
            icon: const Icon(Icons.monitor_weight_outlined),
            onPressed: () => context.push('/nutrition/bmi'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(nutritionSummaryProvider),
        child: AsyncValueView<NutritionSummary>(
          value: summaryAsync,
          onRetry: () => ref.invalidate(nutritionSummaryProvider),
          data: (summary) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _CalorieRing(goal: summary.goal),
              const SizedBox(height: 16),
              _MacroBars(goal: summary.goal),
              const SizedBox(height: 16),
              const _MyDietPlanCard(),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/nutrition/water'),
                      icon: const Icon(Icons.water_drop_outlined),
                      label: const Text('Water Tracker'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/nutrition/tips'),
                      icon: const Icon(Icons.lightbulb_outline),
                      label: const Text('Nutrition Tips'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text("Today's Meals", style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              for (final (type, label, icon) in _mealTypes)
                _MealSection(
                  type: type,
                  label: label,
                  icon: icon,
                  meals: summary.meals.where((m) => m.mealType == type).toList(),
                  onAdd: () => _addFood(context, ref, type),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CalorieRing extends StatelessWidget {
  const _CalorieRing({required this.goal});
  final NutritionGoal goal;

  @override
  Widget build(BuildContext context) {
    final target = goal.targetCalories ?? 2000;
    final progress = target == 0 ? 0.0 : (goal.caloriesLogged / target).clamp(0, 1).toDouble();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: SizedBox(
            width: 160,
            height: 160,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 160,
                  height: 160,
                  child: CircularProgressIndicator(value: progress, strokeWidth: 12, strokeCap: StrokeCap.round),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('${goal.caloriesLogged}',
                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    Text('of $target kcal', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MacroBars extends StatelessWidget {
  const _MacroBars({required this.goal});
  final NutritionGoal goal;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _MacroBar(label: 'Carbs', current: goal.carbsLoggedG, target: goal.targetCarbsG ?? 250, color: AppColors.primary),
            const SizedBox(height: 12),
            _MacroBar(label: 'Protein', current: goal.proteinLoggedG, target: goal.targetProteinG ?? 120, color: const Color(0xFF5FA8D3)),
            const SizedBox(height: 12),
            _MacroBar(label: 'Fats', current: goal.fatsLoggedG, target: goal.targetFatsG ?? 70, color: AppColors.warning),
          ],
        ),
      ),
    );
  }
}

class _MacroBar extends StatelessWidget {
  const _MacroBar({required this.label, required this.current, required this.target, required this.color});
  final String label;
  final int current;
  final int target;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final progress = target == 0 ? 0.0 : (current / target).clamp(0, 1).toDouble();
    return Row(
      children: [
        SizedBox(width: 60, child: Text(label, style: const TextStyle(fontSize: 13))),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(value: progress, minHeight: 8, color: color, backgroundColor: AppColors.divider),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(width: 64, child: Text('${current}g/${target}g', style: const TextStyle(fontSize: 12), textAlign: TextAlign.end)),
      ],
    );
  }
}

class _MyDietPlanCard extends ConsumerWidget {
  const _MyDietPlanCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final planAsync = ref.watch(dietPlanProvider);

    return planAsync.when(
      data: (plan) {
        if (plan == null) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.restaurant_menu, color: AppColors.textSecondary),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'No diet plan assigned yet — ask your trainer to set one up.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        final today = DateTime.now().weekday % 7;
        final todaysMeals = plan.meals.where((m) => m.dayOfWeek == today).toList();

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.restaurant_menu, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(plan.name, style: Theme.of(context).textTheme.titleSmall),
                          if (plan.trainerName != null)
                            Text('by ${plan.trainerName}',
                                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => _showFullPlan(context, plan),
                      child: const Text('View full plan'),
                    ),
                  ],
                ),
                if (todaysMeals.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  Text('Today', style: Theme.of(context).textTheme.labelMedium),
                  for (final m in todaysMeals)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Expanded(child: Text('${m.mealType} · ${m.foodItem.name}', style: const TextStyle(fontSize: 13))),
                          Text('${m.foodItem.calories} kcal', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                ],
              ],
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  void _showFullPlan(BuildContext context, DietPlan plan) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        expand: false,
        builder: (context, scrollController) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(plan.name, style: Theme.of(context).textTheme.titleLarge),
              if (plan.notes != null) ...[
                const SizedBox(height: 4),
                Text(plan.notes!, style: const TextStyle(color: AppColors.textSecondary)),
              ],
              const SizedBox(height: 12),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    for (var day = 0; day < 7; day++)
                      if (plan.meals.any((m) => m.dayOfWeek == day))
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_dayNames[day], style: Theme.of(context).textTheme.titleSmall),
                              for (final m in plan.meals.where((m) => m.dayOfWeek == day))
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Row(
                                    children: [
                                      Expanded(child: Text('${m.mealType} · ${m.foodItem.name}', style: const TextStyle(fontSize: 13))),
                                      Text('${m.foodItem.calories} kcal',
                                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MealSection extends StatelessWidget {
  const _MealSection({
    required this.type,
    required this.label,
    required this.icon,
    required this.meals,
    required this.onAdd,
  });

  final String type;
  final String label;
  final IconData icon;
  final List<MealLog> meals;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final totalCalories = meals.fold<int>(0, (sum, m) => sum + (m.foodItem.calories * m.servings).round());
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('$label${meals.isNotEmpty ? ' · $totalCalories kcal' : ''}',
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: onAdd),
              ],
            ),
            if (meals.isNotEmpty)
              ...meals.map(
                (m) => Padding(
                  padding: const EdgeInsets.only(left: 28, top: 2, bottom: 2),
                  child: Row(
                    children: [
                      Expanded(child: Text(m.foodItem.name, style: const TextStyle(fontSize: 13))),
                      Text('${(m.foodItem.calories * m.servings).round()} kcal',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
