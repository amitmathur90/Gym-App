import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/trainer_directory.dart';
import '../providers/member_trainers_providers.dart';

class MyPtBookingsScreen extends ConsumerWidget {
  const MyPtBookingsScreen({super.key});

  Future<void> _cancel(BuildContext context, WidgetRef ref, PtBooking booking) async {
    try {
      await ref.read(memberTrainersRepositoryProvider).cancelBooking(booking.id);
      ref.invalidate(myPtBookingsProvider);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Session cancelled')));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not cancel session')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(myPtBookingsProvider);
    final formatter = DateFormat('EEE, MMM d · h:mm a');

    return Scaffold(
      appBar: AppBar(title: const Text('My Training Sessions')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myPtBookingsProvider),
        child: AsyncValueView<List<PtBooking>>(
          value: bookingsAsync,
          onRetry: () => ref.invalidate(myPtBookingsProvider),
          data: (bookings) => bookings.isEmpty
              ? ListView(
                  children: const [
                    Padding(
                      padding: EdgeInsets.all(32),
                      child: Text('No personal training sessions booked yet.', textAlign: TextAlign.center),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: bookings.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final b = bookings[index];
                    final canCancel = b.status == 'UPCOMING' || b.status == 'PENDING';
                    return Card(
                      child: ListTile(
                        title: Text(b.trainerName),
                        subtitle: Text(
                          '${formatter.format(b.startTime.toLocal())}'
                          '${b.sessionType != null ? ' · ${b.sessionType}' : ''}',
                        ),
                        trailing: canCancel
                            ? TextButton(
                                onPressed: () => _cancel(context, ref, b),
                                child: const Text('Cancel', style: TextStyle(color: AppColors.danger)),
                              )
                            : _StatusBadge(status: b.status),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final String status;

  static const _colors = {
    'UPCOMING': AppColors.primary,
    'IN_PROGRESS': AppColors.warning,
    'COMPLETED': AppColors.primary,
    'PENDING': AppColors.textSecondary,
    'CANCELLED': AppColors.danger,
  };

  @override
  Widget build(BuildContext context) {
    final color = _colors[status] ?? AppColors.textSecondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700)),
    );
  }
}
