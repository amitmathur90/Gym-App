import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class BmiCalculatorScreen extends StatefulWidget {
  const BmiCalculatorScreen({super.key});

  @override
  State<BmiCalculatorScreen> createState() => _BmiCalculatorScreenState();
}

class _BmiCalculatorScreenState extends State<BmiCalculatorScreen> {
  final _heightController = TextEditingController(text: '175');
  final _weightController = TextEditingController(text: '70');
  double? _bmi;

  @override
  void dispose() {
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  void _calculate() {
    final heightCm = double.tryParse(_heightController.text);
    final weightKg = double.tryParse(_weightController.text);
    if (heightCm == null || weightKg == null || heightCm <= 0 || weightKg <= 0) {
      setState(() => _bmi = null);
      return;
    }
    final heightM = heightCm / 100;
    setState(() => _bmi = weightKg / (heightM * heightM));
  }

  (String, Color) _category(double bmi) {
    if (bmi < 18.5) return ('Underweight', const Color(0xFF5FA8D3));
    if (bmi < 25) return ('Normal', AppColors.primary);
    if (bmi < 30) return ('Overweight', AppColors.warning);
    return ('Obese', AppColors.danger);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('BMI Calculator')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _heightController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Height (cm)'),
                    onChanged: (_) => _calculate(),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _weightController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Weight (kg)'),
                    onChanged: (_) => _calculate(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _calculate, child: const Text('Calculate')),
            const SizedBox(height: 24),
            if (_bmi != null) _BmiResult(bmi: _bmi!, category: _category(_bmi!)),
          ],
        ),
      ),
    );
  }
}

class _BmiResult extends StatelessWidget {
  const _BmiResult({required this.bmi, required this.category});
  final double bmi;
  final (String, Color) category;

  @override
  Widget build(BuildContext context) {
    final (label, color) = category;
    // Clamp into the 15-35 display range used by the gauge below.
    final markerPosition = ((bmi - 15) / (35 - 15)).clamp(0.0, 1.0);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(bmi.toStringAsFixed(1),
                style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const Text('Your BMI', style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
              child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 20),
            Stack(
              children: [
                Container(
                  height: 10,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(6),
                    gradient: const LinearGradient(colors: [
                      Color(0xFF5FA8D3),
                      AppColors.primary,
                      AppColors.warning,
                      AppColors.danger,
                    ]),
                  ),
                ),
                LayoutBuilder(
                  builder: (context, constraints) => Positioned(
                    left: (constraints.maxWidth - 4) * markerPosition,
                    child: Container(width: 4, height: 10, color: Colors.white),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('15', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                Text('35', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
