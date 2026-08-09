import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/core_providers.dart';
import '../../../models/chat_message.dart';

final myTrainerMessagesProvider = FutureProvider.autoDispose<List<ChatMessage>>((ref) {
  return ref.watch(messagesRepositoryProvider).getMessages();
});
