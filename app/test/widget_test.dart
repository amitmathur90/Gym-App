import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:gym_app/main.dart';

void main() {
  testWidgets('App boots to the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: GymApp()));
    await tester.pump();

    expect(find.text('Gym App'), findsOneWidget);
  });
}
