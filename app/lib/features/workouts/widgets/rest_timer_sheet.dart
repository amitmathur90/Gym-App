import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

Future<void> showRestTimerSheet(BuildContext context, {int seconds = 60}) {
  return showModalBottomSheet(
    context: context,
    isDismissible: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (context) => RestTimerSheet(initialSeconds: seconds),
  );
}

class RestTimerSheet extends StatefulWidget {
  const RestTimerSheet({super.key, required this.initialSeconds});
  final int initialSeconds;

  @override
  State<RestTimerSheet> createState() => _RestTimerSheetState();
}

class _RestTimerSheetState extends State<RestTimerSheet> {
  late int _remaining = widget.initialSeconds;
  Timer? _timer;
  bool _running = true;

  @override
  void initState() {
    super.initState();
    _start();
  }

  void _start() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!_running) return;
      setState(() {
        if (_remaining > 0) {
          _remaining--;
        } else {
          t.cancel();
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final minutes = (_remaining ~/ 60).toString().padLeft(2, '0');
    final secs = (_remaining % 60).toString().padLeft(2, '0');
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Rest timer', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            const SizedBox(height: 16),
            Text(
              '$minutes:$secs',
              style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  iconSize: 32,
                  onPressed: () => setState(() => _remaining += 15),
                  icon: const Icon(Icons.add_circle_outline),
                ),
                IconButton(
                  iconSize: 40,
                  onPressed: () => setState(() => _running = !_running),
                  icon: Icon(_running ? Icons.pause_circle : Icons.play_circle),
                ),
                IconButton(
                  iconSize: 32,
                  onPressed: () => setState(() => _remaining = (_remaining - 15).clamp(0, 999)),
                  icon: const Icon(Icons.remove_circle_outline),
                ),
              ],
            ),
            TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Close')),
          ],
        ),
      ),
    );
  }
}
