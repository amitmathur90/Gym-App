import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_drawer.dart';
import '../../auth/providers/auth_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      drawer: const AppDrawer(),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                  child: Text(
                    (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : '?',
                    style: const TextStyle(fontSize: 28, color: AppColors.primary, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                Text(user?.name ?? '', style: Theme.of(context).textTheme.titleLarge),
                Text(user?.email ?? '', style: const TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          ),
          const SizedBox(height: 32),
          const _ProfileTile(icon: Icons.person_outline, label: 'Edit profile'),
          const _ProfileTile(icon: Icons.notifications_outlined, label: 'Notifications'),
          const _ProfileTile(icon: Icons.help_outline, label: 'Help center'),
          const _ProfileTile(icon: Icons.info_outline, label: 'About'),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
            icon: const Icon(Icons.logout, color: AppColors.danger),
            label: const Text('Log out', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon'))),
    );
  }
}
