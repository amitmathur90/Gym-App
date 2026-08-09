import '../../../core/api/api_client.dart';
import '../../../models/chat_message.dart';

/// A member's chat thread with their assigned trainer (`assignedTrainerId`).
/// Throws [ApiException] with a 400 if the member has no assigned trainer.
class MessagesRepository {
  MessagesRepository(this._api);
  final ApiClient _api;

  Future<List<ChatMessage>> getMessages() async {
    final res = await _api.getList('/trainers/me/messages');
    return res.map((e) => ChatMessage.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> sendMessage({String? body, String? attachmentUrl, String? attachmentType}) async {
    await _api.post('/trainers/me/messages', data: {
      if (body != null) 'body': body,
      if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
      if (attachmentType != null) 'attachmentType': attachmentType,
    });
  }
}
