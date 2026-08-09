class MembershipPlan {
  final String id;
  final String name;
  final String? description;
  final int durationDays;
  final double price;
  final List<String> perks;

  MembershipPlan({
    required this.id,
    required this.name,
    this.description,
    required this.durationDays,
    required this.price,
    required this.perks,
  });

  factory MembershipPlan.fromJson(Map<String, dynamic> json) => MembershipPlan(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        durationDays: json['durationDays'] as int,
        price: double.parse(json['price'].toString()),
        perks: (json['perks'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
      );
}

class Membership {
  final String id;
  final String planId;
  final MembershipPlan? plan;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final bool autoRenew;
  final String cardCode;

  Membership({
    required this.id,
    required this.planId,
    this.plan,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.autoRenew,
    required this.cardCode,
  });

  factory Membership.fromJson(Map<String, dynamic> json) => Membership(
        id: json['id'] as String,
        planId: json['planId'] as String,
        plan: json['plan'] != null ? MembershipPlan.fromJson(json['plan'] as Map<String, dynamic>) : null,
        status: json['status'] as String,
        startDate: DateTime.parse(json['startDate'] as String),
        endDate: DateTime.parse(json['endDate'] as String),
        autoRenew: json['autoRenew'] as bool? ?? false,
        cardCode: json['cardCode'] as String,
      );
}

class MembershipStatusSummary {
  final String planName;
  final String status;
  final DateTime endDate;
  final int daysRemaining;

  MembershipStatusSummary({
    required this.planName,
    required this.status,
    required this.endDate,
    required this.daysRemaining,
  });

  factory MembershipStatusSummary.fromJson(Map<String, dynamic> json) => MembershipStatusSummary(
        planName: json['planName'] as String,
        status: json['status'] as String,
        endDate: DateTime.parse(json['endDate'] as String),
        daysRemaining: json['daysRemaining'] as int,
      );
}

class DigitalMembershipCard {
  final String cardCode;
  final String memberName;
  final String planName;
  final DateTime validUntil;

  DigitalMembershipCard({
    required this.cardCode,
    required this.memberName,
    required this.planName,
    required this.validUntil,
  });

  factory DigitalMembershipCard.fromJson(Map<String, dynamic> json) => DigitalMembershipCard(
        cardCode: json['cardCode'] as String,
        memberName: json['memberName'] as String,
        planName: json['planName'] as String,
        validUntil: DateTime.parse(json['validUntil'] as String),
      );
}
