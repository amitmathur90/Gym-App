import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../data/water_settings_storage.dart';
import '../providers/nutrition_providers.dart';
import '../services/water_reminder_service.dart';

class WaterSettingsScreen extends ConsumerStatefulWidget {
  const WaterSettingsScreen({super.key});

  @override
  ConsumerState<WaterSettingsScreen> createState() => _WaterSettingsScreenState();
}

class _WaterSettingsScreenState extends ConsumerState<WaterSettingsScreen> {
  WaterSettings _settings = WaterSettings.defaults;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final settings = await WaterSettingsStorage.instance.load();
    if (!mounted) return;
    setState(() {
      _settings = settings;
      _loading = false;
    });
  }

  Future<void> _pickTime(bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _settings.reminderStart : _settings.reminderEnd,
    );
    if (picked == null) return;
    setState(() {
      _settings = isStart ? _settings.copyWith(reminderStart: picked) : _settings.copyWith(reminderEnd: picked);
    });
  }

  Future<void> _save() async {
    if (_settings.reminderEnd.hour < _settings.reminderStart.hour) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Reminder end time must be after the start time')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await WaterSettingsStorage.instance.save(_settings);
      await ref.read(nutritionRepositoryProvider).updateTargets(targetWaterMl: _settings.dailyGoalGlasses * 250);
      ref.invalidate(nutritionSummaryProvider);

      if (_settings.reminderEnabled) {
        final granted = await WaterReminderService.instance.requestPermission();
        if (!granted) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Notification permission was denied — reminders will not fire.')),
          );
        }
        await WaterReminderService.instance.scheduleHourly(
          startTime: _settings.reminderStart,
          endTime: _settings.reminderEnd,
        );
      } else {
        await WaterReminderService.instance.cancelAll();
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Water settings saved')));
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not save settings')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Water Settings')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Daily goal', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        const Text('How many glasses (250ml) should you drink a day?',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            IconButton(
                              iconSize: 32,
                              icon: const Icon(Icons.remove_circle_outline),
                              onPressed: () => setState(() => _settings = _settings.copyWith(
                                    dailyGoalGlasses: (_settings.dailyGoalGlasses - 1).clamp(1, 20),
                                  )),
                            ),
                            SizedBox(
                              width: 90,
                              child: Text(
                                '${_settings.dailyGoalGlasses} glasses',
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                            ),
                            IconButton(
                              iconSize: 32,
                              icon: const Icon(Icons.add_circle_outline),
                              onPressed: () => setState(() => _settings = _settings.copyWith(
                                    dailyGoalGlasses: (_settings.dailyGoalGlasses + 1).clamp(1, 20),
                                  )),
                            ),
                          ],
                        ),
                        Center(
                          child: Text(
                            '= ${_settings.dailyGoalGlasses * 250}ml',
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Hourly reminders'),
                          subtitle: const Text('Get a notification every hour to drink water'),
                          value: _settings.reminderEnabled,
                          onChanged: (v) => setState(() => _settings = _settings.copyWith(reminderEnabled: v)),
                        ),
                        if (_settings.reminderEnabled) ...[
                          const Divider(),
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('From'),
                            trailing: Text(_settings.reminderStart.format(context)),
                            onTap: () => _pickTime(true),
                          ),
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('To'),
                            trailing: Text(_settings.reminderEnd.format(context)),
                            onTap: () => _pickTime(false),
                          ),
                          const Text(
                            "You'll get a reminder once every hour within this window.",
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.onPrimary),
                        )
                      : const Text('Save'),
                ),
              ],
            ),
    );
  }
}
