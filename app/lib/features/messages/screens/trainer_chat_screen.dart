import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_controller.dart';
import '../providers/messages_providers.dart';

class TrainerChatScreen extends ConsumerStatefulWidget {
  const TrainerChatScreen({super.key});

  @override
  ConsumerState<TrainerChatScreen> createState() => _TrainerChatScreenState();
}

class _TrainerChatScreenState extends ConsumerState<TrainerChatScreen> {
  final _bodyController = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _bodyController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _bodyController.text.trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    try {
      await ref.read(messagesRepositoryProvider).sendMessage(body: text);
      _bodyController.clear();
      ref.invalidate(myTrainerMessagesProvider);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not send message')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(myTrainerMessagesProvider);
    final myUserId = ref.watch(authControllerProvider).user?.id;

    return Scaffold(
      appBar: AppBar(title: const Text('Chat with Your Trainer')),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (messages) => RefreshIndicator(
                onRefresh: () async => ref.invalidate(myTrainerMessagesProvider),
                child: messages.isEmpty
                    ? ListView(
                        children: const [
                          Padding(
                            padding: EdgeInsets.all(32),
                            child: Text('No messages yet — say hello!', textAlign: TextAlign.center),
                          ),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          final m = messages[index];
                          final isMine = m.senderId == myUserId;
                          return Align(
                            alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.7),
                              decoration: BoxDecoration(
                                color: isMine ? AppColors.primary : AppColors.surface,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (m.attachmentUrl != null)
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.network(m.attachmentUrl!, height: 140, fit: BoxFit.cover),
                                    ),
                                  if (m.body != null)
                                    Text(
                                      m.body!,
                                      style: TextStyle(color: isMine ? AppColors.onPrimary : AppColors.textPrimary),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    error is ApiException ? error.message : 'Something went wrong',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _bodyController,
                      decoration: const InputDecoration(hintText: 'Type a message...'),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sending ? null : _send,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
