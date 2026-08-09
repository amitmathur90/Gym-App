import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/membership/data/membership_repository.dart';
import '../../features/workouts/data/workouts_repository.dart';
import '../../features/classes/data/classes_repository.dart';
import '../../features/dashboard/data/dashboard_repository.dart';
import '../../features/nutrition/data/nutrition_repository.dart';
import '../../features/trainer/data/trainer_repository.dart';
import '../../features/admin/data/admin_repository.dart';
import '../../features/trainers/data/member_trainers_repository.dart';
import '../../features/messages/data/messages_repository.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient.instance);

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref.watch(apiClientProvider)));

final membershipRepositoryProvider =
    Provider<MembershipRepository>((ref) => MembershipRepository(ref.watch(apiClientProvider)));

final workoutsRepositoryProvider =
    Provider<WorkoutsRepository>((ref) => WorkoutsRepository(ref.watch(apiClientProvider)));

final classesRepositoryProvider =
    Provider<ClassesRepository>((ref) => ClassesRepository(ref.watch(apiClientProvider)));

final dashboardRepositoryProvider =
    Provider<DashboardRepository>((ref) => DashboardRepository(ref.watch(apiClientProvider)));

final nutritionRepositoryProvider =
    Provider<NutritionRepository>((ref) => NutritionRepository(ref.watch(apiClientProvider)));

final trainerRepositoryProvider =
    Provider<TrainerRepository>((ref) => TrainerRepository(ref.watch(apiClientProvider)));

final adminRepositoryProvider =
    Provider<AdminRepository>((ref) => AdminRepository(ref.watch(apiClientProvider)));

final memberTrainersRepositoryProvider =
    Provider<MemberTrainersRepository>((ref) => MemberTrainersRepository(ref.watch(apiClientProvider)));

final messagesRepositoryProvider =
    Provider<MessagesRepository>((ref) => MessagesRepository(ref.watch(apiClientProvider)));
