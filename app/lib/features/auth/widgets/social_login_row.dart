import 'package:flutter/material.dart';

/// Google/Apple sign-in buttons.
///
/// Wiring these up for real requires platform OAuth setup (Google Cloud
/// client IDs + SHA fingerprints, Apple Sign In capability) that only the
/// app owner can provide, plus the `google_sign_in` / `sign_in_with_apple`
/// packages. The backend endpoint (`POST /auth/social`) is ready to receive
/// a verified id token once that's wired up; for now these buttons explain
/// what's missing instead of faking a login.
class SocialLoginRow extends StatelessWidget {
  const SocialLoginRow({super.key});

  void _notConfigured(BuildContext context, String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$provider sign-in needs OAuth credentials configured — see backend README.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: const [
            Expanded(child: Divider()),
            Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('or continue with')),
            Expanded(child: Divider()),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _notConfigured(context, 'Google'),
                icon: const Icon(Icons.g_mobiledata, size: 28),
                label: const Text('Google'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _notConfigured(context, 'Apple'),
                icon: const Icon(Icons.apple),
                label: const Text('Apple'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
