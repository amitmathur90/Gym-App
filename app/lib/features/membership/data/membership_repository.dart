import '../../../core/api/api_client.dart';
import '../../../models/membership.dart';
import '../../../models/payment_order.dart';

class MembershipRepository {
  MembershipRepository(this._api);
  final ApiClient _api;

  Future<List<MembershipPlan>> getPlans() async {
    final list = await _api.getList('/membership/plans');
    return list.map((e) => MembershipPlan.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Step 1 of the Razorpay flow: create a pending payment + Razorpay order.
  /// [type] is one of 'PURCHASE', 'RENEW', 'UPGRADE'.
  Future<PaymentOrder> createOrder({
    required String type,
    required String method,
    String? planId,
    String? membershipId,
    bool autoRenew = false,
  }) async {
    final res = await _api.post('/membership/order', data: {
      'type': type,
      'method': method,
      'autoRenew': autoRenew,
      if (planId != null) 'planId': planId,
      if (membershipId != null) 'membershipId': membershipId,
    });
    return PaymentOrder.fromJson(res);
  }

  /// Step 2: confirm the Razorpay signature and apply the payment.
  Future<Membership> verifyPayment({
    required String paymentId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    final res = await _api.post('/membership/verify', data: {
      'paymentId': paymentId,
      'razorpayOrderId': razorpayOrderId,
      'razorpayPaymentId': razorpayPaymentId,
      'razorpaySignature': razorpaySignature,
    });
    return Membership.fromJson(res['membership'] as Map<String, dynamic>);
  }

  Future<List<Membership>> history() async {
    final list = await _api.getList('/membership/history');
    return list.map((e) => Membership.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<DigitalMembershipCard> card() async {
    final res = await _api.get('/membership/card');
    return DigitalMembershipCard.fromJson(res);
  }
}
