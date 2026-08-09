import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell, required this.destinations});

  final StatefulNavigationShell navigationShell;
  final List<NavigationDestination> destinations;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
        destinations: destinations,
      ),
    );
  }
}

const memberNavDestinations = [
  NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
  NavigationDestination(
      icon: Icon(Icons.card_membership_outlined), selectedIcon: Icon(Icons.card_membership), label: 'Membership'),
  NavigationDestination(
      icon: Icon(Icons.fitness_center_outlined), selectedIcon: Icon(Icons.fitness_center), label: 'Workouts'),
  NavigationDestination(
      icon: Icon(Icons.event_available_outlined), selectedIcon: Icon(Icons.event_available), label: 'Classes'),
  NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
];

const trainerNavDestinations = [
  NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
  NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Members'),
  NavigationDestination(icon: Icon(Icons.event_note_outlined), selectedIcon: Icon(Icons.event_note), label: 'Sessions'),
  NavigationDestination(
      icon: Icon(Icons.restaurant_menu_outlined), selectedIcon: Icon(Icons.restaurant_menu), label: 'Diet'),
  NavigationDestination(
      icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: 'Alerts'),
];

const adminNavDestinations = [
  NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
  NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Members'),
  NavigationDestination(
      icon: Icon(Icons.event_available_outlined), selectedIcon: Icon(Icons.event_available), label: 'Classes'),
];
