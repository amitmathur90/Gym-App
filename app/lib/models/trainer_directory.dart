num _parseNum(dynamic v) => v == null ? 0 : (num.tryParse(v.toString()) ?? 0);

class TrainerListItem {
  final String id;
  final String name;
  final String? avatarUrl;
  final String? bio;
  final List<String> specialties;
  final String? qualification;
  final int? experienceYears;
  final num? ratePerHour;

  TrainerListItem({
    required this.id,
    required this.name,
    this.avatarUrl,
    this.bio,
    required this.specialties,
    this.qualification,
    this.experienceYears,
    this.ratePerHour,
  });

  factory TrainerListItem.fromJson(Map<String, dynamic> json) => TrainerListItem(
        id: json['id'] as String,
        name: (json['user'] as Map<String, dynamic>?)?['name'] as String? ?? 'Trainer',
        avatarUrl: (json['user'] as Map<String, dynamic>?)?['avatarUrl'] as String?,
        bio: json['bio'] as String?,
        specialties: (json['specialties'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
        qualification: json['qualification'] as String?,
        experienceYears: json['experienceYears'] as int?,
        ratePerHour: json['ratePerHour'] != null ? _parseNum(json['ratePerHour']) : null,
      );
}

class PtBooking {
  final String id;
  final String trainerId;
  final String trainerName;
  final DateTime startTime;
  final DateTime endTime;
  final String status;
  final String? sessionType;

  PtBooking({
    required this.id,
    required this.trainerId,
    required this.trainerName,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.sessionType,
  });

  factory PtBooking.fromJson(Map<String, dynamic> json) => PtBooking(
        id: json['id'] as String,
        trainerId: json['trainerId'] as String,
        trainerName: ((json['trainer'] as Map<String, dynamic>?)?['user'] as Map<String, dynamic>?)?['name'] as String? ?? 'Trainer',
        startTime: DateTime.parse(json['startTime'] as String),
        endTime: DateTime.parse(json['endTime'] as String),
        status: json['status'] as String,
        sessionType: json['sessionType'] as String?,
      );
}
