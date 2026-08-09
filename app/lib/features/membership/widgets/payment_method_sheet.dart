import 'package:flutter/material.dart';

const _methods = [
  ('UPI', 'UPI', Icons.qr_code),
  ('CREDIT_CARD', 'Credit Card', Icons.credit_card),
  ('DEBIT_CARD', 'Debit Card', Icons.credit_card_outlined),
  ('NET_BANKING', 'Net Banking', Icons.account_balance),
];

/// Bottom sheet payment method picker.
///
/// The chosen method is recorded on the backend Payment row and passed as a
/// hint to Razorpay Checkout, which then handles the actual UPI/card/net
/// banking flow and collects payment.
Future<String?> showPaymentMethodSheet(BuildContext context) {
  return showModalBottomSheet<String>(
    context: context,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Choose payment method', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final (value, label, icon) in _methods)
              ListTile(
                leading: Icon(icon),
                title: Text(label),
                onTap: () => Navigator.of(context).pop(value),
              ),
          ],
        ),
      ),
    ),
  );
}
