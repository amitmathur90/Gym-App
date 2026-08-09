import 'membership.dart';

class UpcomingClass {
  final String bookingId;
  final String className;
  final DateTime startsAt;

  UpcomingClass({required this.bookingId, required this.className, required this.startsAt});

  factory UpcomingClass.fromJson(Map<String, dynamic> json) => UpcomingClass(
        bookingId: json['bookingId'] as String,
        className: json['className'] as String,
        startsAt: DateTime.parse(json['startsAt'] as String),
      );
}

class WorkoutSummary {
  final int sessionsThisWeek;
  final int totalSetsThisWeek;

  WorkoutSummary({required this.sessionsThisWeek, required this.totalSetsThisWeek});

  factory WorkoutSummary.fromJson(Map<String, dynamic> json) => WorkoutSummary(
        sessionsThisWeek: json['sessionsThisWeek'] as int,
        totalSetsThisWeek: json['totalSetsThisWeek'] as int,
      );
}

class DailyGoalProgress {
  final int? targetCalories;
  final int? targetWaterMl;
  final int? targetWorkoutMinutes;
  final int caloriesLogged;
  final int waterLoggedMl;
  final int workoutMinutesLogged;

  DailyGoalProgress({
    this.targetCalories,
    this.targetWaterMl,
    this.targetWorkoutMinutes,
    required this.caloriesLogged,
    required this.waterLoggedMl,
    required this.workoutMinutesLogged,
  });

  factory DailyGoalProgress.fromJson(Map<String, dynamic> json) => DailyGoalProgress(
        targetCalories: json['targetCalories'] as int?,
        targetWaterMl: json['targetWaterMl'] as int?,
        targetWorkoutMinutes: json['targetWorkoutMinutes'] as int?,
        caloriesLogged: json['caloriesLogged'] as int? ?? 0,
        waterLoggedMl: json['waterLoggedMl'] as int? ?? 0,
        workoutMinutesLogged: json['workoutMinutesLogged'] as int? ?? 0,
      );
}

class DashboardData {
  final MembershipStatusSummary? membershipStatus;
  final List<UpcomingClass> upcomingClasses;
  final WorkoutSummary workoutSummary;
  final DailyGoalProgress dailyGoal;

  DashboardData({
    this.membershipStatus,
    required this.upcomingClasses,
    required this.workoutSummary,
    required this.dailyGoal,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) => DashboardData(
        membershipStatus:
            json['membershipStatus'] != null ? MembershipStatusSummary.fromJson(json['membershipStatus']) : null,
        upcomingClasses: (json['upcomingClasses'] as List<dynamic>? ?? [])
            .map((e) => UpcomingClass.fromJson(e as Map<String, dynamic>))
            .toList(),
        workoutSummary: WorkoutSummary.fromJson(json['workoutSummary'] as Map<String, dynamic>),
        dailyGoal: DailyGoalProgress.fromJson(json['dailyGoal'] as Map<String, dynamic>),
      );
}
