import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

/// Schedules/cancels the hourly water-intake reminder notifications.
///
/// Reminders repeat daily at each hour mark inside [startTime, endTime] —
/// implemented as one `zonedSchedule`d notification per hour, each set to
/// repeat at that same time every day (`DateTimeComponents.time`). IDs
/// 1000-1023 are reserved for these (one per hour of day) so re-scheduling
/// can cleanly cancel exactly the old set before creating the new one.
class WaterReminderService {
  WaterReminderService._();
  static final WaterReminderService instance = WaterReminderService._();

  static const _idBase = 1000;
  final _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    tz_data.initializeTimeZones();
    // The `timezone` package defaults tz.local to UTC unless told
    // otherwise; without this, reminders would fire at the wrong wall-clock
    // time for anyone not in UTC.
    final deviceTimezone = await FlutterTimezone.getLocalTimezone();
    tz.setLocalLocation(tz.getLocation(deviceTimezone));

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);
    await _plugin.initialize(initSettings);

    const channel = AndroidNotificationChannel(
      'water_reminders',
      'Water intake reminders',
      description: 'Hourly reminders to drink water',
      importance: Importance.high,
      playSound: true,
    );
    await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    _initialized = true;
  }

  Future<bool> requestPermission() async {
    await _ensureInitialized();
    final granted = await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    return granted ?? true;
  }

  Future<void> cancelAll() async {
    await _ensureInitialized();
    for (var hour = 0; hour < 24; hour++) {
      await _plugin.cancel(_idBase + hour);
    }
  }

  /// Schedules a daily-repeating reminder for every hour between
  /// [startTime] and [endTime] (inclusive of the start hour, exclusive of
  /// minutes past it — e.g. 08:30-21:00 reminds at 09:00, 10:00 ... 21:00).
  Future<void> scheduleHourly({required TimeOfDay startTime, required TimeOfDay endTime}) async {
    await _ensureInitialized();
    await cancelAll();

    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'water_reminders',
        'Water intake reminders',
        channelDescription: 'Hourly reminders to drink water',
        importance: Importance.high,
        priority: Priority.high,
        playSound: true,
      ),
    );

    final startHour = startTime.minute > 0 ? startTime.hour + 1 : startTime.hour;
    for (var hour = startHour; hour <= endTime.hour; hour++) {
      await _plugin.zonedSchedule(
        _idBase + hour,
        'Time to hydrate 💧',
        "Don't forget to log a glass of water.",
        _nextInstanceOf(hour),
        details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: DateTimeComponents.time,
      );
    }
  }

  tz.TZDateTime _nextInstanceOf(int hour) {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour);
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }
}
