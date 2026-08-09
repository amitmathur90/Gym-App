num _parseNum(dynamic v) => v == null ? 0 : (num.tryParse(v.toString()) ?? 0);

class AdminDashboardData {
  final int totalMembers;
  final int activeMemberships;
  final int totalTrainers;
  final int newMembersThisMonth;
  final num monthlyRevenue;
  final num totalRevenue;
  final int upcomingClassesCount;

  AdminDashboardData({
    required this.totalMembers,
    required this.activeMemberships,
    required this.totalTrainers,
    required this.newMembersThisMonth,
    required this.monthlyRevenue,
    required this.totalRevenue,
    required this.upcomingClassesCount,
  });

  factory AdminDashboardData.fromJson(Map<String, dynamic> json) => AdminDashboardData(
        totalMembers: json['totalMembers'] as int? ?? 0,
        activeMemberships: json['activeMemberships'] as int? ?? 0,
        totalTrainers: json['totalTrainers'] as int? ?? 0,
        newMembersThisMonth: json['newMembersThisMonth'] as int? ?? 0,
        monthlyRevenue: _parseNum(json['monthlyRevenue']),
        totalRevenue: _parseNum(json['totalRevenue']),
        upcomingClassesCount: json['upcomingClassesCount'] as int? ?? 0,
      );
}

class AdminMemberSummary {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final String? planName;
  final DateTime? planEndDate;

  AdminMemberSummary({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.planName,
    this.planEndDate,
  });

  factory AdminMemberSummary.fromJson(Map<String, dynamic> json) {
    final memberships = json['memberships'] as List<dynamic>? ?? [];
    final activeMembership = memberships.isNotEmpty ? memberships.first as Map<String, dynamic> : null;
    return AdminMemberSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      role: json['role'] as String? ?? 'MEMBER',
      planName: (activeMembership?['plan'] as Map<String, dynamic>?)?['name'] as String?,
      planEndDate: activeMembership?['endDate'] != null ? DateTime.parse(activeMembership!['endDate'] as String) : null,
    );
  }
}

class AdminUpcomingClass {
  final String className;
  final String type;
  final String? trainerName;
  final DateTime startsAt;
  final DateTime endsAt;
  final int capacity;
  final int booked;

  AdminUpcomingClass({
    required this.className,
    required this.type,
    this.trainerName,
    required this.startsAt,
    required this.endsAt,
    required this.capacity,
    required this.booked,
  });

  bool get isFull => booked >= capacity;
}
