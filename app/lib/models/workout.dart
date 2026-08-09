class Exercise {
  final String id;
  final String name;
  final String? description;
  final String muscleGroup;
  final String? equipment;
  final String? videoUrl;
  final String? thumbnailUrl;

  Exercise({
    required this.id,
    required this.name,
    this.description,
    required this.muscleGroup,
    this.equipment,
    this.videoUrl,
    this.thumbnailUrl,
  });

  factory Exercise.fromJson(Map<String, dynamic> json) => Exercise(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        muscleGroup: json['muscleGroup'] as String,
        equipment: json['equipment'] as String?,
        videoUrl: json['videoUrl'] as String?,
        thumbnailUrl: json['thumbnailUrl'] as String?,
      );
}

class WorkoutProgram {
  final String id;
  final String name;
  final String? description;
  final String level;
  final int durationWeeks;

  WorkoutProgram({
    required this.id,
    required this.name,
    this.description,
    required this.level,
    required this.durationWeeks,
  });

  factory WorkoutProgram.fromJson(Map<String, dynamic> json) => WorkoutProgram(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        level: json['level'] as String,
        durationWeeks: json['durationWeeks'] as int,
      );
}

class WorkoutPlanExercise {
  final String id;
  final Exercise exercise;
  final int sets;
  final int reps;
  final int restSeconds;

  WorkoutPlanExercise({
    required this.id,
    required this.exercise,
    required this.sets,
    required this.reps,
    required this.restSeconds,
  });

  factory WorkoutPlanExercise.fromJson(Map<String, dynamic> json) => WorkoutPlanExercise(
        id: json['id'] as String,
        exercise: Exercise.fromJson(json['exercise'] as Map<String, dynamic>),
        sets: json['sets'] as int,
        reps: json['reps'] as int,
        restSeconds: json['restSeconds'] as int? ?? 60,
      );
}

class WorkoutPlan {
  final String id;
  final String name;
  final int dayOfWeek;
  final WorkoutProgram? program;
  final List<WorkoutPlanExercise> exercises;

  WorkoutPlan({
    required this.id,
    required this.name,
    required this.dayOfWeek,
    this.program,
    required this.exercises,
  });

  factory WorkoutPlan.fromJson(Map<String, dynamic> json) => WorkoutPlan(
        id: json['id'] as String,
        name: json['name'] as String,
        dayOfWeek: json['dayOfWeek'] as int,
        program: json['program'] != null ? WorkoutProgram.fromJson(json['program'] as Map<String, dynamic>) : null,
        exercises: (json['exercises'] as List<dynamic>? ?? [])
            .map((e) => WorkoutPlanExercise.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class WorkoutLog {
  final String id;
  final Exercise exercise;
  final int setsCompleted;
  final int repsCompleted;
  final double? weightKg;
  final DateTime completedAt;

  WorkoutLog({
    required this.id,
    required this.exercise,
    required this.setsCompleted,
    required this.repsCompleted,
    this.weightKg,
    required this.completedAt,
  });

  factory WorkoutLog.fromJson(Map<String, dynamic> json) => WorkoutLog(
        id: json['id'] as String,
        exercise: Exercise.fromJson(json['exercise'] as Map<String, dynamic>),
        setsCompleted: json['setsCompleted'] as int,
        repsCompleted: json['repsCompleted'] as int,
        weightKg: json['weightKg'] != null ? double.parse(json['weightKg'].toString()) : null,
        completedAt: DateTime.parse(json['completedAt'] as String),
      );
}
