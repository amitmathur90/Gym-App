class ChatMessage {
  final String id;
  final String senderId;
  final String receiverId;
  final String? body;
  final String? attachmentUrl;
  final String? attachmentType;
  final DateTime createdAt;
  final DateTime? readAt;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    this.body,
    this.attachmentUrl,
    this.attachmentType,
    required this.createdAt,
    this.readAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String,
        senderId: json['senderId'] as String,
        receiverId: json['receiverId'] as String,
        body: json['body'] as String?,
        attachmentUrl: json['attachmentUrl'] as String?,
        attachmentType: json['attachmentType'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        readAt: json['readAt'] != null ? DateTime.parse(json['readAt'] as String) : null,
      );
}
