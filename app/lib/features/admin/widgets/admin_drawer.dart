import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/drawer_section.dart';
import '../../auth/providers/auth_controller.dart';

/// Site-map drawer for the Admin mini app, reachable from the menu icon on
/// every top-level screen. Mirrors the member app's collapsible-section
/// pattern (DrawerSection) even though there are only a few destinations,
/// for a consistent feel across all three apps.
class AdminDrawer extends ConsumerWidget {
  const AdminDrawer({super.key});

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
                  const Text('Admin Panel', style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard_outlined),
              title: const Text('Dashboard'),
              onTap: () => go('/admin/home'),
            ),
            DrawerSection(
              icon: Icons.people_outline,
              title: 'People',
              children: [
                ListTile(
                  leading: const Icon(Icons.people_outline),
                  title: const Text('Members'),
                  onTap: () => go('/admin/members'),
                ),
                ListTile(
                  leading: const Icon(Icons.fitness_center_outlined),
                  title: const Text('Trainers'),
                  onTap: () => push('/admin/home/trainers'),
                ),
              ],
            ),
            ListTile(
              leading: const Icon(Icons.event_available_outlined),
              title: const Text('Classes'),
              onTap: () => go('/admin/classes'),
            ),
            ListTile(
              leading: const Icon(Icons.water_drop_outlined),
              title: const Text('Water Intake'),
              subtitle: const Text('Your own hydration tracker', style: TextStyle(fontSize: 11)),
              onTap: () => push('/nutrition/water'),
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
