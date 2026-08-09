import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/nutrition.dart';
import '../providers/nutrition_providers.dart';

const _quickAddOptions = [100, 250, 500];
const _weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

class WaterTrackerScreen extends ConsumerWidget {
  const WaterTrackerScreen({super.key});

  Future<void> _addWater(BuildContext context, WidgetRef ref, int amountMl) async {
    try {
      await ref.read(nutritionRepositoryProvider).logWater(amountMl);
      ref.invalidate(nutritionSummaryProvider);
      ref.invalidate(weeklyWaterProvider);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not log water')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(nutritionSummaryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Water Intake'),
        actions: [
          IconButton(
            tooltip: 'Water settings',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/nutrition/water/settings'),
          ),
        ],
      ),
      body: AsyncValueView<NutritionSummary>(
        value: summaryAsync,
        onRetry: () => ref.invalidate(nutritionSummaryProvider),
        data: (summary) {
          final goal = summary.goal;
          final target = goal.targetWaterMl ?? 3000;
          final progress = target == 0 ? 0.0 : (goal.waterLoggedMl / target).clamp(0, 1).toDouble();
          final glassesFilled = (goal.waterLoggedMl / 250).floor();
          final glassesTotal = (target / 250).ceil();

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: SizedBox(
                  width: 200,
                  height: 200,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 200,
                        height: 200,
                        child: CircularProgressIndicator(
                          value: progress,
                          strokeWidth: 14,
                          strokeCap: StrokeCap.round,
                          color: const Color(0xFF5FA8D3),
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('${(goal.waterLoggedMl / 1000).toStringAsFixed(1)}L',
                              style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold)),
                          Text('of ${(target / 1000).toStringAsFixed(1)}L',
                              style: const TextStyle(color: AppColors.textSecondary)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (int i = 0; i < glassesTotal; i++)
                    Icon(
                      Icons.local_drink,
                      size: 28,
                      color: i < glassesFilled ? const Color(0xFF5FA8D3) : AppColors.divider,
                    ),
                ],
              ),
              const SizedBox(height: 32),
              Text('Quick add', style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (final amount in _quickAddOptions)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(minimumSize: const Size(64, 44)),
                        onPressed: () => _addWater(context, ref, amount),
                        child: Text('+${amount}ml'),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 32),
              const _WeeklyWaterChart(),
            ],
          );
        },
      ),
    );
  }
}

class _WeeklyWaterChart extends ConsumerWidget {
  const _WeeklyWaterChart();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weeklyAsync = ref.watch(weeklyWaterProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('This week', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            SizedBox(
              height: 140,
              child: weeklyAsync.when(
                data: (mlByDay) {
                  final glassesByDay = mlByDay.map((ml) => ml / 250).toList();
                  final maxY = glassesByDay.isEmpty ? 8.0 : glassesByDay.reduce((a, b) => a > b ? a : b);
                  return BarChart(
                    BarChartData(
                      maxY: maxY <= 0 ? 8 : maxY + 2,
                      gridData: const FlGridData(show: false),
                      borderData: FlBorderData(show: false),
                      titlesData: FlTitlesData(
                        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) => Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(_weekDayLabels[value.toInt() % 7], style: const TextStyle(fontSize: 12)),
                            ),
                          ),
                        ),
                      ),
                      barGroups: [
                        for (int i = 0; i < glassesByDay.length; i++)
                          BarChartGroupData(x: i, barRods: [
                            BarChartRodData(
                              toY: glassesByDay[i],
                              color: const Color(0xFF5FA8D3),
                              width: 18,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ]),
                      ],
                    ),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(child: Text('Could not load chart')),
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Text('Glasses (250ml) per day', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
            ),
          ],
        ),
      ),
    );
  }
}
