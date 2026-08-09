import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/gym_class.dart';
import '../providers/classes_providers.dart';

class MyBookingsScreen extends ConsumerWidget {
  const MyBookingsScreen({super.key});

  Future<void> _cancel(BuildContext context, WidgetRef ref, ClassBooking booking) async {
    try {
      await ref.read(classesRepositoryProvider).cancel(booking.id);
      ref.invalidate(myClassBookingsProvider);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking cancelled')));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not cancel booking')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(myClassBookingsProvider);
    final formatter = DateFormat('EEE, MMM d · h:mm a');

    return Scaffold(
      appBar: AppBar(title: const Text('My bookings')),
      body: AsyncValueView<List<ClassBooking>>(
        value: bookingsAsync,
        onRetry: () => ref.invalidate(myClassBookingsProvider),
        data: (bookings) => bookings.isEmpty
            ? const Center(child: Text('No class bookings yet.'))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: bookings.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final b = bookings[index];
                  final isBooked = b.status == 'BOOKED';
                  return Card(
                    child: ListTile(
                      title: Text(b.className),
                      subtitle: Text('${formatter.format(b.startsAt.toLocal())} · ${b.status}'),
                      trailing: isBooked
                          ? TextButton(
                              onPressed: () => _cancel(context, ref, b),
                              child: const Text('Cancel', style: TextStyle(color: AppColors.danger)),
                            )
                          : Icon(
                              b.status == 'CANCELLED' ? Icons.cancel_outlined : Icons.check_circle_outline,
                              color: b.status == 'CANCELLED' ? AppColors.danger : AppColors.primary,
                            ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
