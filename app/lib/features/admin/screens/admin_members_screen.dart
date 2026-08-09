import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/admin_self.dart';
import '../providers/admin_providers.dart';
import '../widgets/admin_drawer.dart';

class AdminMembersScreen extends ConsumerWidget {
  const AdminMembersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(adminMembersProvider);
    final dateFormat = DateFormat('MMM d, y');

    return Scaffold(
      appBar: AppBar(title: const Text('Members')),
      drawer: const AdminDrawer(),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Search by name, email, or phone',
              ),
              onChanged: (value) => ref.read(adminMemberSearchProvider.notifier).state = value,
            ),
          ),
          Expanded(
            child: AsyncValueView<List<AdminMemberSummary>>(
              value: membersAsync,
              onRetry: () => ref.invalidate(adminMembersProvider),
              data: (members) => members.isEmpty
                  ? const Center(child: Text('No members found.'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: members.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final m = members[index];
                        return Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                              child: Text(
                                m.name.isNotEmpty ? m.name[0].toUpperCase() : '?',
                                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                              ),
                            ),
                            title: Text(m.name),
                            subtitle: Text(
                              '${m.email}\n'
                              '${m.planName != null ? '${m.planName}${m.planEndDate != null ? ' · until ${dateFormat.format(m.planEndDate!.toLocal())}' : ''}' : 'No active membership'}',
                            ),
                            isThreeLine: true,
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
