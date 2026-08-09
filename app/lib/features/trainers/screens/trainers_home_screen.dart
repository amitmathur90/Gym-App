import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/trainer_directory.dart';
import '../providers/member_trainers_providers.dart';

class TrainersHomeScreen extends ConsumerWidget {
  const TrainersHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trainersAsync = ref.watch(memberTrainersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Personal Trainers'),
        actions: [
          IconButton(icon: const Icon(Icons.event_note), onPressed: () => context.push('/trainers/bookings')),
        ],
      ),
      body: AsyncValueView<List<TrainerListItem>>(
        value: trainersAsync,
        onRetry: () => ref.invalidate(memberTrainersProvider),
        data: (trainers) => trainers.isEmpty
            ? const Center(child: Text('No trainers available right now.'))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: trainers.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final t = trainers[index];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                                child: Text(
                                  t.name.isNotEmpty ? t.name[0].toUpperCase() : '?',
                                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(t.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                    if (t.qualification != null)
                                      Text(t.qualification!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (t.specialties.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: t.specialties
                                  .map((s) => Chip(
                                        label: Text(s, style: const TextStyle(fontSize: 11)),
                                        padding: EdgeInsets.zero,
                                        visualDensity: VisualDensity.compact,
                                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ))
                                  .toList(),
                            ),
                          ],
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                t.experienceYears != null ? '${t.experienceYears} yrs experience' : '',
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(minimumSize: const Size(0, 40), padding: const EdgeInsets.symmetric(horizontal: 20)),
                                onPressed: () => _openBookingSheet(context, ref, t),
                                child: const Text('Book session'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }

  Future<void> _openBookingSheet(BuildContext context, WidgetRef ref, TrainerListItem trainer) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => _BookingSheet(trainer: trainer),
    );
  }
}

class _BookingSheet extends ConsumerStatefulWidget {
  const _BookingSheet({required this.trainer});
  final TrainerListItem trainer;

  @override
  ConsumerState<_BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends ConsumerState<_BookingSheet> {
  DateTime _date = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _time = const TimeOfDay(hour: 9, minute: 0);
  final _sessionTypeController = TextEditingController(text: 'Personal Training');
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _sessionTypeController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(context: context, initialTime: _time);
    if (picked != null) setState(() => _time = picked);
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    final start = DateTime(_date.year, _date.month, _date.day, _time.hour, _time.minute);
    final end = start.add(const Duration(hours: 1));
    try {
      await ref.read(memberTrainersRepositoryProvider).bookTrainer(
            trainerId: widget.trainer.id,
            start: start,
            end: end,
            sessionType: _sessionTypeController.text.trim().isEmpty ? null : _sessionTypeController.text.trim(),
          );
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Booked with ${widget.trainer.name}!')));
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Could not book this session';
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Book with ${widget.trainer.name}', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: _pickDate,
            icon: const Icon(Icons.calendar_today, size: 18),
            label: Text('${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _pickTime,
            icon: const Icon(Icons.access_time, size: 18),
            label: Text(_time.format(context)),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _sessionTypeController,
            decoration: const InputDecoration(labelText: 'Session type'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
          ],
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: Text(_submitting ? 'Booking...' : 'Confirm booking'),
          ),
        ],
      ),
    );
  }
}
