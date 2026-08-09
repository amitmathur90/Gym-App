class GymClass {
  final String id;
  final String name;
  final String type;
  final String? description;
  final String? trainerName;
  final int capacity;
  final int durationMin;

  GymClass({
    required this.id,
    required this.name,
    required this.type,
    this.description,
    this.trainerName,
    required this.capacity,
    required this.durationMin,
  });

  factory GymClass.fromJson(Map<String, dynamic> json) => GymClass(
        id: json['id'] as String,
        name: json['name'] as String,
        type: json['type'] as String,
        description: json['description'] as String?,
        trainerName: json['trainer']?['user']?['name'] as String?,
        capacity: json['capacity'] as int,
        durationMin: json['durationMin'] as int,
      );
}

class ClassSchedule {
  final String id;
  final String classId;
  final String className;
  final String type;
  final String? trainerName;
  final DateTime startsAt;
  final DateTime endsAt;
  final int capacity;
  final int booked;

  ClassSchedule({
    required this.id,
    required this.classId,
    required this.className,
    required this.type,
    this.trainerName,
    required this.startsAt,
    required this.endsAt,
    required this.capacity,
    required this.booked,
  });

  bool get isFull => booked >= capacity;

  factory ClassSchedule.fromJson(Map<String, dynamic> json) => ClassSchedule(
        id: json['id'] as String,
        classId: json['classId'] as String,
        className: json['className'] as String,
        type: json['type'] as String,
        trainerName: json['trainerName'] as String?,
        startsAt: DateTime.parse(json['startsAt'] as String),
        endsAt: DateTime.parse(json['endsAt'] as String),
        capacity: json['capacity'] as int,
        booked: json['booked'] as int,
      );
}

class ClassBooking {
  final String id;
  final String status;
  final String className;
  final DateTime startsAt;

  ClassBooking({
    required this.id,
    required this.status,
    required this.className,
    required this.startsAt,
  });

  factory ClassBooking.fromJson(Map<String, dynamic> json) => ClassBooking(
        id: json['id'] as String,
        status: json['status'] as String,
        className: json['schedule']['gymClass']['name'] as String,
        startsAt: DateTime.parse(json['schedule']['startsAt'] as String),
      );
}
