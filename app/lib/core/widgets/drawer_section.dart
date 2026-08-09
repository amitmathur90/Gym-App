import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// A collapsible group of drawer items — collapsed by default, expands on
/// tap to reveal its children. Used to keep the drawer's initial view short
/// across all three apps (member/trainer/admin) instead of listing every
/// destination flat.
class DrawerSection extends StatelessWidget {
  const DrawerSection({super.key, required this.icon, required this.title, required this.children, this.initiallyExpanded = false});

  final IconData icon;
  final String title;
  final List<Widget> children;
  final bool initiallyExpanded;

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        initiallyExpanded: initiallyExpanded,
        leading: Icon(icon, color: AppColors.textSecondary),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        iconColor: AppColors.primary,
        collapsedIconColor: AppColors.textSecondary,
        childrenPadding: const EdgeInsets.only(left: 12),
        children: children,
      ),
    );
  }
}
