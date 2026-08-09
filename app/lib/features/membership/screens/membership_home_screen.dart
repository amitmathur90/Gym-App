import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_drawer.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/membership.dart';
import '../../auth/providers/auth_controller.dart';
import '../providers/membership_providers.dart';
import '../services/razorpay_checkout.dart';
import '../widgets/payment_method_sheet.dart';

class MembershipHomeScreen extends ConsumerWidget {
  const MembershipHomeScreen({super.key});

  Future<void> _checkout(
    BuildContext context,
    WidgetRef ref, {
    required String type,
    required String description,
    String? planId,
    String? membershipId,
    required String successMessage,
    required String failureMessage,
  }) async {
    final method = await showPaymentMethodSheet(context);
    if (method == null) return;

    try {
      final repository = ref.read(membershipRepositoryProvider);
      final order = await repository.createOrder(
        type: type,
        method: method,
        planId: planId,
        membershipId: membershipId,
      );
      await payWithRazorpay(
        repository: repository,
        order: order,
        description: description,
        user: ref.read(authControllerProvider).user,
      );
      ref.invalidate(membershipHistoryProvider);
      ref.invalidate(activeMembershipProvider);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(successMessage)));
    } on PaymentCancelledException {
      // User closed the checkout sheet — nothing to report.
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : failureMessage)));
    }
  }

  Future<void> _purchase(BuildContext context, WidgetRef ref, MembershipPlan plan) => _checkout(
        context,
        ref,
        type: 'PURCHASE',
        description: '${plan.name} membership',
        planId: plan.id,
        successMessage: '${plan.name} activated!',
        failureMessage: 'Purchase failed',
      );

  Future<void> _renew(BuildContext context, WidgetRef ref, Membership active) => _checkout(
        context,
        ref,
        type: 'RENEW',
        description: '${active.plan?.name ?? 'Membership'} renewal',
        membershipId: active.id,
        successMessage: 'Membership renewed!',
        failureMessage: 'Renewal failed',
      );

  Future<void> _upgrade(BuildContext context, WidgetRef ref, Membership active, MembershipPlan newPlan) => _checkout(
        context,
        ref,
        type: 'UPGRADE',
        description: 'Upgrade to ${newPlan.name}',
        planId: newPlan.id,
        membershipId: active.id,
        successMessage: 'Upgraded to ${newPlan.name}!',
        failureMessage: 'Upgrade failed',
      );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(membershipPlansProvider);
    final activeAsync = ref.watch(activeMembershipProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Membership'),
        actions: [
          IconButton(icon: const Icon(Icons.history), onPressed: () => context.push('/membership/history')),
          IconButton(icon: const Icon(Icons.qr_code), onPressed: () => context.push('/membership/card')),
        ],
      ),
      drawer: const AppDrawer(),
      body: AsyncValueView<List<MembershipPlan>>(
        value: plansAsync,
        onRetry: () => ref.invalidate(membershipPlansProvider),
        data: (plans) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            activeAsync.when(
              data: (active) => active == null
                  ? const SizedBox.shrink()
                  : Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primary, AppColors.primaryDark],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            active.plan?.name ?? 'Current plan',
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'Valid until ${active.endDate.toLocal().toString().split(' ').first}',
                            style: const TextStyle(color: Colors.white70),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppColors.primaryDark,
                            ),
                            onPressed: () => _renew(context, ref, active),
                            child: const Text('Renew Now'),
                          ),
                        ],
                      ),
                    ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 8),
            Text('Plans', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final plan in plans)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(plan.name, style: Theme.of(context).textTheme.titleMedium),
                            Text('₹${plan.price.toStringAsFixed(0)}',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.primary)),
                          ],
                        ),
                        Text('${plan.durationDays} days'),
                        const SizedBox(height: 8),
                        ...plan.perks.map((p) => Row(children: [
                              const Icon(Icons.check, size: 16, color: AppColors.primary),
                              const SizedBox(width: 6),
                              Text(p),
                            ])),
                        const SizedBox(height: 12),
                        activeAsync.when(
                          data: (active) => SizedBox(
                            width: double.infinity,
                            child: active == null
                                ? ElevatedButton(
                                    onPressed: () => _purchase(context, ref, plan),
                                    child: const Text('Buy'),
                                  )
                                : (active.planId == plan.id
                                    ? const OutlinedButton(onPressed: null, child: Text('Current plan'))
                                    : OutlinedButton(
                                        onPressed: () => _upgrade(context, ref, active, plan),
                                        child: const Text('Upgrade to this plan'),
                                      )),
                          ),
                          loading: () => const SizedBox.shrink(),
                          error: (_, __) => const SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
