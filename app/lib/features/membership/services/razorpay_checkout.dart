import 'dart:async';

import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../../core/api/api_exception.dart';
import '../../../models/membership.dart';
import '../../../models/payment_order.dart';
import '../../../models/user.dart';
import '../data/membership_repository.dart';

class PaymentCancelledException implements Exception {}

/// Drives one Razorpay Checkout session: opens the sheet for [order], waits
/// for the user to complete or dismiss it, and on success calls the backend
/// to verify the signature and apply the payment. A fresh [Razorpay]
/// instance is created per call and torn down afterwards.
Future<Membership> payWithRazorpay({
  required MembershipRepository repository,
  required PaymentOrder order,
  required String description,
  AppUser? user,
}) {
  final razorpay = Razorpay();
  final completer = _CheckoutCompleter();

  razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse response) async {
    try {
      final membership = await repository.verifyPayment(
        paymentId: order.paymentId,
        razorpayOrderId: response.orderId!,
        razorpayPaymentId: response.paymentId!,
        razorpaySignature: response.signature!,
      );
      completer.succeed(membership);
    } catch (e) {
      completer.fail(e is ApiException ? e : ApiException('Payment succeeded but could not be confirmed'));
    }
  });

  razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse response) {
    if (response.code == Razorpay.PAYMENT_CANCELLED) {
      completer.fail(PaymentCancelledException());
    } else {
      completer.fail(ApiException(response.message ?? 'Payment failed'));
    }
  });

  razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse response) {
    completer.fail(ApiException('${response.walletName ?? 'External wallet'} is not supported yet'));
  });

  razorpay.open({
    'key': order.keyId,
    'order_id': order.orderId,
    'amount': order.amount,
    'currency': order.currency,
    'name': 'Gym Fit',
    'description': description,
    if (user != null)
      'prefill': {
        if (user.email.isNotEmpty) 'email': user.email,
        if (user.phone != null) 'contact': user.phone,
      },
  });

  return completer.future.whenComplete(razorpay.clear);
}

class _CheckoutCompleter {
  final _completer = Completer<Membership>();
  Future<Membership> get future => _completer.future;

  void succeed(Membership membership) {
    if (!_completer.isCompleted) _completer.complete(membership);
  }

  void fail(Object error) {
    if (!_completer.isCompleted) _completer.completeError(error);
  }
}
