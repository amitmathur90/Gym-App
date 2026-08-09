class PaymentOrder {
  final String paymentId;
  final String orderId;
  final int amount; // smallest currency unit (paise for INR)
  final String currency;
  final String keyId;

  PaymentOrder({
    required this.paymentId,
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.keyId,
  });

  factory PaymentOrder.fromJson(Map<String, dynamic> json) => PaymentOrder(
        paymentId: json['paymentId'] as String,
        orderId: json['orderId'] as String,
        amount: json['amount'] as int,
        currency: json['currency'] as String,
        keyId: json['keyId'] as String,
      );
}
