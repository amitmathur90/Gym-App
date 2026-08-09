import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.fitness_center, color: AppColors.primary, size: 48),
            ),
            const SizedBox(height: 20),
            const Text(
              'GYM FIT',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 30,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'STRONGER EVERYDAY',
              style: TextStyle(color: AppColors.primary, fontSize: 12, letterSpacing: 3, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 32),
            const CircularProgressIndicator(color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
