import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

const _tips = [
  (
    Icons.water_drop_outlined,
    'Stay hydrated',
    'Drink at least 2.5-3L of water a day, more on workout days — even mild dehydration hurts strength and endurance.'
  ),
  (
    Icons.egg_outlined,
    'Prioritize protein',
    'Aim for 1.6-2.2g of protein per kg of bodyweight to support muscle repair and growth.'
  ),
  (
    Icons.schedule_outlined,
    'Time your carbs',
    'Eat most of your carbs around your workout — before for energy, after to replenish glycogen.'
  ),
  (
    Icons.set_meal_outlined,
    'Don\'t fear fats',
    'Healthy fats (nuts, olive oil, fatty fish) support hormone production — aim for 20-30% of daily calories.'
  ),
  (
    Icons.restaurant_menu_outlined,
    'Eat whole foods first',
    'Build meals around vegetables, lean protein, and whole grains before reaching for processed snacks.'
  ),
  (
    Icons.nightlight_outlined,
    'Don\'t skip sleep',
    'Poor sleep increases cravings and cortisol, making it harder to recover and lose fat.'
  ),
  (
    Icons.trending_up_outlined,
    'Track consistently',
    'Logging meals for even a few weeks builds an accurate sense of portion sizes and habits.'
  ),
];

class NutritionTipsScreen extends StatelessWidget {
  const NutritionTipsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nutrition Tips')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _tips.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final (icon, title, body) = _tips[index];
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: 4),
                        Text(body, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
