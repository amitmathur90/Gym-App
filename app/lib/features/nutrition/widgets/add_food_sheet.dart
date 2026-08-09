import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../models/nutrition.dart';
import '../providers/nutrition_providers.dart';

Future<FoodItem?> showAddFoodSheet(BuildContext context, WidgetRef ref, String mealType) {
  return showModalBottomSheet<FoodItem>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (context) => _AddFoodSheet(mealType: mealType),
  );
}

class _AddFoodSheet extends ConsumerWidget {
  const _AddFoodSheet({required this.mealType});
  final String mealType;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final foodsAsync = ref.watch(foodCatalogProvider(mealType));

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add food', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.5),
              child: foodsAsync.when(
                data: (foods) => foods.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Text('No foods in the catalog for this meal yet.'),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        itemCount: foods.length,
                        itemBuilder: (context, index) {
                          final food = foods[index];
                          return ListTile(
                            leading: const Icon(Icons.restaurant, color: AppColors.primary),
                            title: Text(food.name),
                            subtitle: Text('${food.servingLabel} · ${food.calories} kcal'),
                            onTap: () => Navigator.of(context).pop(food),
                          );
                        },
                      ),
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (_, __) => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Text('Could not load foods'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
