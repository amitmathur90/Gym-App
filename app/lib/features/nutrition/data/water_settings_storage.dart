import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WaterSettings {
  final int dailyGoalGlasses;
  final bool reminderEnabled;
  final TimeOfDay reminderStart;
  final TimeOfDay reminderEnd;

  const WaterSettings({
    required this.dailyGoalGlasses,
    required this.reminderEnabled,
    required this.reminderStart,
    required this.reminderEnd,
  });

  static const defaults = WaterSettings(
    dailyGoalGlasses: 8,
    reminderEnabled: false,
    reminderStart: TimeOfDay(hour: 8, minute: 0),
    reminderEnd: TimeOfDay(hour: 22, minute: 0),
  );

  WaterSettings copyWith({
    int? dailyGoalGlasses,
    bool? reminderEnabled,
    TimeOfDay? reminderStart,
    TimeOfDay? reminderEnd,
  }) {
    return WaterSettings(
      dailyGoalGlasses: dailyGoalGlasses ?? this.dailyGoalGlasses,
      reminderEnabled: reminderEnabled ?? this.reminderEnabled,
      reminderStart: reminderStart ?? this.reminderStart,
      reminderEnd: reminderEnd ?? this.reminderEnd,
    );
  }
}

/// Local (device-only) storage for water-reminder preferences. These are
/// notification-scheduling concerns rather than account data, so they don't
/// need to sync across devices the way the daily ml goal (stored on the
/// backend via DailyGoal.targetWaterMl) does.
class WaterSettingsStorage {
  WaterSettingsStorage._();
  static final WaterSettingsStorage instance = WaterSettingsStorage._();

  static const _goalKey = 'water_goal_glasses';
  static const _reminderEnabledKey = 'water_reminder_enabled';
  static const _reminderStartKey = 'water_reminder_start_minutes';
  static const _reminderEndKey = 'water_reminder_end_minutes';

  Future<WaterSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final startMinutes = prefs.getInt(_reminderStartKey);
    final endMinutes = prefs.getInt(_reminderEndKey);
    return WaterSettings(
      dailyGoalGlasses: prefs.getInt(_goalKey) ?? WaterSettings.defaults.dailyGoalGlasses,
      reminderEnabled: prefs.getBool(_reminderEnabledKey) ?? WaterSettings.defaults.reminderEnabled,
      reminderStart: startMinutes != null
          ? TimeOfDay(hour: startMinutes ~/ 60, minute: startMinutes % 60)
          : WaterSettings.defaults.reminderStart,
      reminderEnd: endMinutes != null
          ? TimeOfDay(hour: endMinutes ~/ 60, minute: endMinutes % 60)
          : WaterSettings.defaults.reminderEnd,
    );
  }

  Future<void> save(WaterSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_goalKey, settings.dailyGoalGlasses);
    await prefs.setBool(_reminderEnabledKey, settings.reminderEnabled);
    await prefs.setInt(_reminderStartKey, settings.reminderStart.hour * 60 + settings.reminderStart.minute);
    await prefs.setInt(_reminderEndKey, settings.reminderEnd.hour * 60 + settings.reminderEnd.minute);
  }
}
