import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/nutrition_providers.dart';

enum _Gender { male, female }

const _activityLevels = [
  (1.2, 'Sedentary (little or no exercise)'),
  (1.375, 'Light (exercise 1-3 days/week)'),
  (1.55, 'Moderate (exercise 3-5 days/week)'),
  (1.725, 'Active (exercise 6-7 days/week)'),
  (1.9, 'Very active (hard exercise & physical job)'),
];

class CalorieCalculatorScreen extends ConsumerStatefulWidget {
  const CalorieCalculatorScreen({super.key});

  @override
  ConsumerState<CalorieCalculatorScreen> createState() => _CalorieCalculatorScreenState();
}

class _CalorieCalculatorScreenState extends ConsumerState<CalorieCalculatorScreen> {
  final _ageController = TextEditingController(text: '28');
  final _heightController = TextEditingController(text: '175');
  final _weightController = TextEditingController(text: '70');
  _Gender _gender = _Gender.male;
  double _activityFactor = _activityLevels[2].$1;
  double? _bmr;
  double? _tdee;
  bool _saving = false;

  @override
  void dispose() {
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  void _calculate() {
    final age = int.tryParse(_ageController.text);
    final heightCm = double.tryParse(_heightController.text);
    final weightKg = double.tryParse(_weightController.text);
    if (age == null || heightCm == null || weightKg == null) return;

    final bmr = _gender == _Gender.male
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

    setState(() {
      _bmr = bmr;
      _tdee = bmr * _activityFactor;
    });
  }

  Future<void> _saveAsGoal() async {
    if (_tdee == null) return;
    setState(() => _saving = true);
    try {
      await ref.read(nutritionRepositoryProvider).updateTargets(targetCalories: _tdee!.round());
      ref.invalidate(nutritionSummaryProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Daily calorie goal set to ${_tdee!.round()} kcal')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not save goal')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Calorie Calculator')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SegmentedButton<_Gender>(
            segments: const [
              ButtonSegment(value: _Gender.male, label: Text('Male')),
              ButtonSegment(value: _Gender.female, label: Text('Female')),
            ],
            selected: {_gender},
            onSelectionChanged: (v) => setState(() => _gender = v.first),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _ageController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Age'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _heightController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Height (cm)'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _weightController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Weight (kg)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<double>(
            initialValue: _activityFactor,
            decoration: const InputDecoration(labelText: 'Activity level'),
            items: [
              for (final (factor, label) in _activityLevels)
                DropdownMenuItem(value: factor, child: Text(label, overflow: TextOverflow.ellipsis)),
            ],
            onChanged: (v) => setState(() => _activityFactor = v ?? _activityFactor),
          ),
          const SizedBox(height: 20),
          ElevatedButton(onPressed: _calculate, child: const Text('Calculate')),
          if (_tdee != null) ...[
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Text('${_tdee!.round()}',
                        style:
                            const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    const Text('kcal / day to maintain weight', style: TextStyle(color: AppColors.textSecondary)),
                    const SizedBox(height: 8),
                    Text('Base metabolic rate: ${_bmr!.round()} kcal',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: _saving ? null : _saveAsGoal,
                        child: _saving
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Save as my daily calorie goal'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
