import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_controller.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/reset_password_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/membership/screens/membership_home_screen.dart';
import '../../features/membership/screens/membership_history_screen.dart';
import '../../features/membership/screens/membership_card_screen.dart';
import '../../features/workouts/screens/workouts_home_screen.dart';
import '../../features/workouts/screens/exercise_library_screen.dart';
import '../../features/workouts/screens/build_plan_screen.dart';
import '../../features/classes/screens/classes_home_screen.dart';
import '../../features/classes/screens/my_bookings_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/nutrition/screens/nutrition_home_screen.dart';
import '../../features/nutrition/screens/bmi_calculator_screen.dart';
import '../../features/nutrition/screens/calorie_calculator_screen.dart';
import '../../features/nutrition/screens/water_tracker_screen.dart';
import '../../features/nutrition/screens/water_settings_screen.dart';
import '../../features/nutrition/screens/nutrition_tips_screen.dart';
import '../../features/trainer/screens/trainer_dashboard_screen.dart';
import '../../features/trainer/screens/trainer_members_screen.dart';
import '../../features/trainer/screens/trainer_member_detail_screen.dart';
import '../../features/trainer/screens/trainer_sessions_screen.dart';
import '../../features/trainer/screens/trainer_diet_plans_screen.dart';
import '../../features/trainer/screens/trainer_alerts_screen.dart';
import '../../features/admin/screens/admin_dashboard_screen.dart';
import '../../features/admin/screens/admin_members_screen.dart';
import '../../features/admin/screens/admin_classes_screen.dart';
import '../../features/admin/screens/admin_trainers_screen.dart';
import '../../features/trainers/screens/trainers_home_screen.dart';
import '../../features/trainers/screens/my_pt_bookings_screen.dart';
import '../../features/messages/screens/trainer_chat_screen.dart';
import '../widgets/app_shell.dart';
import 'splash_screen.dart';

class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(Ref ref) {
    ref.listen<AuthState>(authControllerProvider, (previous, next) {
      if (previous?.status != next.status) notifyListeners();
    });
  }
}

/// True if [path] is `root` itself or nested under it (`root/...`) — unlike
/// a bare [String.startsWith] check, this doesn't also match unrelated
/// sibling paths that happen to share the prefix (e.g. `/trainers`, the
/// member-facing trainer directory, must NOT be treated as nested under the
/// `/trainer` staff shell).
bool _isUnderRoot(String path, String root) => path == root || path.startsWith('$root/');

final routerProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _RouterRefreshNotifier(ref);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refreshNotifier,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      final authStatus = authState.status;
      final path = state.matchedLocation;
      final isAuthRoute = path.startsWith('/login') ||
          path.startsWith('/signup') ||
          path.startsWith('/otp') ||
          path.startsWith('/forgot-password') ||
          path.startsWith('/reset-password');

      if (authStatus == AuthStatus.unknown) {
        return path == '/splash' ? null : '/splash';
      }
      if (authStatus == AuthStatus.unauthenticated) {
        return isAuthRoute ? null : '/login';
      }
      // authenticated — route to the shell matching this account's role.
      final role = authState.user?.role ?? 'MEMBER';
      final homePath = role == 'TRAINER' ? '/trainer/home' : (role == 'ADMIN' ? '/admin/home' : '/home');

      if (isAuthRoute || path == '/splash') return homePath;

      // Staff roles get a mini native experience and shouldn't wander into
      // the member shell (or each other's); members shouldn't reach staff
      // routes even if they guess the URL. Nutrition/water tracking is the
      // one exception — it's a personal-wellness feature open to any role,
      // since staff accounts are also gym-going people who can use their
      // own water tracker and reminders just like a member would.
      final isSharedRoute = _isUnderRoot(path, '/nutrition');
      if (role == 'TRAINER' && !_isUnderRoot(path, '/trainer') && !isSharedRoute) return homePath;
      if (role == 'ADMIN' && !_isUnderRoot(path, '/admin') && !isSharedRoute) return homePath;
      if (role == 'MEMBER' && (_isUnderRoot(path, '/trainer') || _isUnderRoot(path, '/admin'))) return homePath;

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (context, state) => const SignupScreen()),
      GoRoute(
        path: '/otp',
        builder: (context, state) => OtpScreen(
          email: state.uri.queryParameters['email'] ?? '',
          purpose: state.uri.queryParameters['purpose'] ?? 'SIGNUP',
          devOtp: state.uri.queryParameters['devOtp'],
        ),
      ),
      GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => ResetPasswordScreen(prefillToken: state.uri.queryParameters['token']),
      ),
      GoRoute(
        path: '/nutrition',
        builder: (context, state) => const NutritionHomeScreen(),
        routes: [
          GoRoute(path: 'bmi', builder: (context, state) => const BmiCalculatorScreen()),
          GoRoute(path: 'calorie-calculator', builder: (context, state) => const CalorieCalculatorScreen()),
          GoRoute(
            path: 'water',
            builder: (context, state) => const WaterTrackerScreen(),
            routes: [
              GoRoute(path: 'settings', builder: (context, state) => const WaterSettingsScreen()),
            ],
          ),
          GoRoute(path: 'tips', builder: (context, state) => const NutritionTipsScreen()),
        ],
      ),
      GoRoute(
        path: '/trainers',
        builder: (context, state) => const TrainersHomeScreen(),
        routes: [
          GoRoute(path: 'bookings', builder: (context, state) => const MyPtBookingsScreen()),
        ],
      ),
      GoRoute(path: '/messages', builder: (context, state) => const TrainerChatScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell, destinations: memberNavDestinations),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/home', builder: (context, state) => const DashboardScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/membership',
              builder: (context, state) => const MembershipHomeScreen(),
              routes: [
                GoRoute(path: 'history', builder: (context, state) => const MembershipHistoryScreen()),
                GoRoute(path: 'card', builder: (context, state) => const MembershipCardScreen()),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/workouts',
              builder: (context, state) => const WorkoutsHomeScreen(),
              routes: [
                GoRoute(path: 'exercises', builder: (context, state) => const ExerciseLibraryScreen()),
                GoRoute(
                  path: 'build',
                  builder: (context, state) => BuildPlanScreen(programId: state.uri.queryParameters['programId']),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/classes',
              builder: (context, state) => const ClassesHomeScreen(),
              routes: [
                GoRoute(path: 'bookings', builder: (context, state) => const MyBookingsScreen()),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
          ]),
        ],
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell, destinations: trainerNavDestinations),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/trainer/home', builder: (context, state) => const TrainerDashboardScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/trainer/members',
              builder: (context, state) => const TrainerMembersScreen(),
              routes: [
                GoRoute(
                  path: ':id',
                  builder: (context, state) => TrainerMemberDetailScreen(memberId: state.pathParameters['id']!),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/trainer/sessions', builder: (context, state) => const TrainerSessionsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/trainer/diet-plans', builder: (context, state) => const TrainerDietPlansScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/trainer/alerts', builder: (context, state) => const TrainerAlertsScreen()),
          ]),
        ],
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell, destinations: adminNavDestinations),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/admin/home',
              builder: (context, state) => const AdminDashboardScreen(),
              routes: [
                GoRoute(path: 'trainers', builder: (context, state) => const AdminTrainersScreen()),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/admin/members', builder: (context, state) => const AdminMembersScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/admin/classes', builder: (context, state) => const AdminClassesScreen()),
          ]),
        ],
      ),
    ],
  );
});
