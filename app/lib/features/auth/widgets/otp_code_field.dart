import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

/// A row of boxed single-digit inputs, matching the app's OTP screen design.
/// Keeps [length] digits (6, to match the backend's OTP format) while
/// looking like the individually-boxed code entry from the design spec.
class OtpCodeField extends StatefulWidget {
  const OtpCodeField({super.key, required this.length, required this.onChanged});

  final int length;
  final ValueChanged<String> onChanged;

  @override
  State<OtpCodeField> createState() => _OtpCodeFieldState();
}

class _OtpCodeFieldState extends State<OtpCodeField> {
  late final List<TextEditingController> _controllers =
      List.generate(widget.length, (_) => TextEditingController());
  late final List<FocusNode> _focusNodes = List.generate(widget.length, (_) => FocusNode());

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _emit() => widget.onChanged(_controllers.map((c) => c.text).join());

  void _onChanged(int index, String value) {
    if (value.length > 1) {
      // Handle pasting a full code into one box.
      final digits = value.replaceAll(RegExp(r'\D'), '');
      for (var i = 0; i < widget.length && i < digits.length; i++) {
        _controllers[i].text = digits[i];
      }
      _emit();
      final next = digits.length.clamp(0, widget.length - 1);
      _focusNodes[next].requestFocus();
      return;
    }
    if (value.isNotEmpty && index < widget.length - 1) {
      _focusNodes[index + 1].requestFocus();
    }
    _emit();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        for (var i = 0; i < widget.length; i++)
          SizedBox(
            width: 44,
            height: 52,
            child: TextField(
              controller: _controllers[i],
              focusNode: _focusNodes[i],
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              maxLength: widget.length, // allows pasting the whole code into box 1
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(counterText: '', contentPadding: EdgeInsets.zero),
              onChanged: (v) => _onChanged(i, v),
              onTap: () => _controllers[i].selection =
                  TextSelection(baseOffset: 0, extentOffset: _controllers[i].text.length),
            ),
          ),
      ],
    );
  }
}
