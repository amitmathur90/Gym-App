import 'nutrition.dart';

num _parseNum(dynamic v) => v == null ? 0 : (num.tryParse(v.toString()) ?? 0);

class TrainerDashboardData {
  final int totalAssignedMembers;
  final int todaysSessions;
  final int upcomingSessions;
  final int pendingWorkoutPlans;
  final int completedSessionsToday;
  final int unreadMessages;
  final int newAssignmentsThisMonth;
  final double? averageRating;

  TrainerDashboardData({
    required this.totalAssignedMembers,
    required this.todaysSessions,
    required this.upcomingSessions,
    required this.pendingWorkoutPlans,
    required this.completedSessionsToday,
    required this.unreadMessages,
    required this.newAssignmentsThisMonth,
    this.averageRating,
  });

  factory TrainerDashboardData.fromJson(Map<String, dynamic> json) => TrainerDashboardData(
        totalAssignedMembers: json['totalAssignedMembers'] as int? ?? 0,
        todaysSessions: json['todaysSessions'] as int? ?? 0,
        upcomingSessions: json['upcomingSessions'] as int? ?? 0,
        pendingWorkoutPlans: json['pendingWorkoutPlans'] as int? ?? 0,
        completedSessionsToday: json['completedSessionsToday'] as int? ?? 0,
        unreadMessages: json['unreadMessages'] as int? ?? 0,
        newAssignmentsThisMonth: json['newAssignmentsThisMonth'] as int? ?? 0,
        averageRating: json['averageRating'] != null ? _parseNum(json['averageRating']).toDouble() : null,
      );
}

class TrainerMemberCard {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final String? membershipPlan;
  final String? goal;
  final DateTime? lastVisit;
  final int weeklyConsistencyPct;
  final DateTime? nextSession;

  TrainerMemberCard({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatarUrl,
    this.membershipPlan,
    this.goal,
    this.lastVisit,
    required this.weeklyConsistencyPct,
    this.nextSession,
  });

  factory TrainerMemberCard.fromJson(Map<String, dynamic> json) => TrainerMemberCard(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        membershipPlan: json['membershipPlan'] as String?,
        goal: json['goal'] as String?,
        lastVisit: json['lastVisit'] != null ? DateTime.parse(json['lastVisit'] as String) : null,
        weeklyConsistencyPct: json['weeklyConsistencyPct'] as int? ?? 0,
        nextSession: json['nextSession'] != null ? DateTime.parse(json['nextSession'] as String) : null,
      );
}

class TrainerSessionItem {
  final String id;
  final DateTime startTime;
  final DateTime endTime;
  final String status;
  final String? sessionType;
  final String? notes;
  final String memberId;
  final String memberName;

  TrainerSessionItem({
    required this.id,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.sessionType,
    this.notes,
    required this.memberId,
    required this.memberName,
  });

  factory TrainerSessionItem.fromJson(Map<String, dynamic> json) {
    final member = json['member'] as Map<String, dynamic>? ?? {};
    return TrainerSessionItem(
      id: json['id'] as String,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      status: json['status'] as String,
      sessionType: json['sessionType'] as String?,
      notes: json['notes'] as String?,
      memberId: member['id'] as String? ?? '',
      memberName: member['name'] as String? ?? 'Member',
    );
  }
}

/// A structured diet plan the trainer authored for one of their assigned
/// members — distinct from models/nutrition.dart's `DietPlan`, which is the
/// member's own read-only view of a single assigned plan (no member/target
/// fields since it's implicitly "mine").
class TrainerDietPlan {
  final String id;
  final String name;
  final String? notes;
  final int? targetWaterMl;
  final String? supplements;
  final String memberId;
  final String memberName;
  final List<DietPlanMealEntry> meals;

  TrainerDietPlan({
    required this.id,
    required this.name,
    this.notes,
    this.targetWaterMl,
    this.supplements,
    required this.memberId,
    required this.memberName,
    required this.meals,
  });

  factory TrainerDietPlan.fromJson(Map<String, dynamic> json) {
    final member = json['member'] as Map<String, dynamic>? ?? {};
    return TrainerDietPlan(
      id: json['id'] as String,
      name: json['name'] as String,
      notes: json['notes'] as String?,
      targetWaterMl: json['targetWaterMl'] as int?,
      supplements: json['supplements'] as String?,
      memberId: member['id'] as String? ?? '',
      memberName: member['name'] as String? ?? 'Member',
      meals: (json['meals'] as List<dynamic>? ?? [])
          .map((e) => DietPlanMealEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// A member's water intake as seen by their trainer — read-only, the member
/// is still the only one who can log entries.
class MemberWaterProgress {
  final int todayWaterMl;
  final int targetWaterMl;
  final List<int> weeklyMl;

  MemberWaterProgress({required this.todayWaterMl, required this.targetWaterMl, required this.weeklyMl});

  factory MemberWaterProgress.fromJson(Map<String, dynamic> json) => MemberWaterProgress(
        todayWaterMl: json['todayWaterMl'] as int? ?? 0,
        targetWaterMl: json['targetWaterMl'] as int? ?? 2500,
        weeklyMl: (json['weekly'] as List<dynamic>? ?? [])
            .map((e) => (e as Map<String, dynamic>)['waterLoggedMl'] as int)
            .toList(),
      );
}

class TrainerAlertItem {
  final String type;
  final String message;
  final DateTime createdAt;

  TrainerAlertItem({required this.type, required this.message, required this.createdAt});

  factory TrainerAlertItem.fromJson(Map<String, dynamic> json) => TrainerAlertItem(
        type: json['type'] as String,
        message: json['message'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
