import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_controller.dart';
import '../theme/app_theme.dart';
import 'drawer_section.dart';

/// Full site-map navigation drawer, reachable from the menu icon on every
/// main tab's AppBar. Complements the bottom nav bar (which only covers the
/// 5 top-level tabs) by also surfacing nested/deep screens like membership
/// history, the exercise library, and the whole Diet & Nutrition section.
/// Related destinations are grouped into collapsible sections — collapsed by
/// default — so the drawer opens short instead of dumping every screen at once.
class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    void go(String path) {
      Navigator.of(context).pop();
      context.go(path);
    }

    void push(String path) {
      Navigator.of(context).pop();
      context.push(path);
    }

    return Drawer(
      backgroundColor: AppColors.surface,
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: Colors.white24,
                    child: Text(
                      (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : '?',
                      style: const TextStyle(fontSize: 20, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(user?.name ?? 'Gym Fit', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  if (user?.email != null) Text(user!.email, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home_outlined),
              title: const Text('Home'),
              onTap: () => go('/home'),
            ),
            DrawerSection(
              icon: Icons.card_membership_outlined,
              title: 'Membership',
              children: [
                ListTile(
                  leading: const Icon(Icons.card_membership_outlined),
                  title: const Text('Plans & Manage'),
                  onTap: () => go('/membership'),
                ),
                ListTile(
                  leading: const Icon(Icons.history),
                  title: const Text('Membership History'),
                  onTap: () => push('/membership/history'),
                ),
                ListTile(
                  leading: const Icon(Icons.qr_code),
                  title: const Text('Digital Membership Card'),
                  onTap: () => push('/membership/card'),
                ),
              ],
            ),
            DrawerSection(
              icon: Icons.fitness_center_outlined,
              title: 'Workouts',
              children: [
                ListTile(
                  leading: const Icon(Icons.fitness_center_outlined),
                  title: const Text('My Plans & Programs'),
                  onTap: () => go('/workouts'),
                ),
                ListTile(
                  leading: const Icon(Icons.menu_book_outlined),
                  title: const Text('Exercise Library'),
                  onTap: () => push('/workouts/exercises'),
                ),
              ],
            ),
            DrawerSection(
              icon: Icons.event_available_outlined,
              title: 'Classes',
              children: [
                ListTile(
                  leading: const Icon(Icons.event_available_outlined),
                  title: const Text('Browse & Book'),
                  onTap: () => go('/classes'),
                ),
                ListTile(
                  leading: const Icon(Icons.event_note_outlined),
                  title: const Text('My Bookings'),
                  onTap: () => push('/classes/bookings'),
                ),
              ],
            ),
            DrawerSection(
              icon: Icons.sports_gymnastics_outlined,
              title: 'Personal Training',
              children: [
                ListTile(
                  leading: const Icon(Icons.fitness_center_outlined),
                  title: const Text('Find a Trainer'),
                  onTap: () => push('/trainers'),
                ),
                ListTile(
                  leading: const Icon(Icons.event_note_outlined),
                  title: const Text('My Training Sessions'),
                  onTap: () => push('/trainers/bookings'),
                ),
                ListTile(
                  leading: const Icon(Icons.chat_bubble_outline),
                  title: const Text('Chat with Trainer'),
                  onTap: () => push('/messages'),
                ),
              ],
            ),
            DrawerSection(
              icon: Icons.restaurant_menu_outlined,
              title: 'Diet & Nutrition',
              children: [
                ListTile(
                  leading: const Icon(Icons.restaurant_menu_outlined),
                  title: const Text('Meal Plans & Macros'),
                  onTap: () => push('/nutrition'),
                ),
                ListTile(
                  leading: const Icon(Icons.monitor_weight_outlined),
                  title: const Text('BMI Calculator'),
                  onTap: () => push('/nutrition/bmi'),
                ),
                ListTile(
                  leading: const Icon(Icons.calculate_outlined),
                  title: const Text('Calorie Calculator'),
                  onTap: () => push('/nutrition/calorie-calculator'),
                ),
                ListTile(
                  leading: const Icon(Icons.water_drop_outlined),
                  title: const Text('Water Intake Tracker'),
                  onTap: () => push('/nutrition/water'),
                ),
                ListTile(
                  leading: const Icon(Icons.lightbulb_outline),
                  title: const Text('Nutrition Tips'),
                  onTap: () => push('/nutrition/tips'),
                ),
              ],
            ),
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: const Text('Profile'),
              onTap: () => go('/profile'),
            ),
            const Divider(height: 24),
            ListTile(
              leading: const Icon(Icons.logout, color: AppColors.danger),
              title: const Text('Log out', style: TextStyle(color: AppColors.danger)),
              onTap: () {
                Navigator.of(context).pop();
                ref.read(authControllerProvider.notifier).logout();
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
