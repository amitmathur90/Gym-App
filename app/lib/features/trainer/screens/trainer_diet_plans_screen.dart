import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/providers/core_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../models/trainer_self.dart';
import '../../nutrition/providers/nutrition_providers.dart';
import '../providers/trainer_providers.dart';
import '../widgets/trainer_drawer.dart';

const _dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const _mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

class TrainerDietPlansScreen extends ConsumerStatefulWidget {
  const TrainerDietPlansScreen({super.key});

  @override
  ConsumerState<TrainerDietPlansScreen> createState() => _TrainerDietPlansScreenState();
}

class _TrainerDietPlansScreenState extends ConsumerState<TrainerDietPlansScreen> {
  final _expanded = <String, bool>{};

  Future<void> _delete(TrainerDietPlan plan) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete diet plan?'),
        content: Text('Remove "${plan.name}" for ${plan.memberName}?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(trainerRepositoryProvider).deleteDietPlan(plan.id);
      ref.invalidate(trainerDietPlansProvider);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : 'Could not delete plan')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final plansAsync = ref.watch(trainerDietPlansProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Diet Plans'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: AppColors.surface,
              shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
              builder: (context) => const _CreateDietPlanSheet(),
            ),
          ),
        ],
      ),
      drawer: const TrainerDrawer(),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(trainerDietPlansProvider),
        child: AsyncValueView<List<TrainerDietPlan>>(
          value: plansAsync,
          onRetry: () => ref.invalidate(trainerDietPlansProvider),
          data: (plans) => plans.isEmpty
              ? ListView(
                  children: const [
                    Padding(
                      padding: EdgeInsets.all(32),
                      child: Text('No diet plans yet. Tap + to create one.', textAlign: TextAlign.center),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: plans.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final p = plans[index];
                    final isExpanded = _expanded[p.id] ?? false;
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                      Text(p.memberName, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: AppColors.danger),
                                  onPressed: () => _delete(p),
                                ),
                              ],
                            ),
                            if (p.targetWaterMl != null || p.supplements != null) ...[
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 8,
                                children: [
                                  if (p.targetWaterMl != null)
                                    Chip(
                                      label: Text('💧 ${(p.targetWaterMl! / 1000).toStringAsFixed(1)}L/day', style: const TextStyle(fontSize: 11)),
                                      visualDensity: VisualDensity.compact,
                                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ),
                                  if (p.supplements != null)
                                    Chip(
                                      label: Text('💊 ${p.supplements}', style: const TextStyle(fontSize: 11)),
                                      visualDensity: VisualDensity.compact,
                                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ),
                                ],
                              ),
                            ],
                            TextButton(
                              onPressed: () => setState(() => _expanded[p.id] = !isExpanded),
                              child: Text('${p.meals.length} meal${p.meals.length == 1 ? '' : 's'} ${isExpanded ? '▲' : '▼'}'),
                            ),
                            if (isExpanded)
                              for (final dayIdx in {for (final m in p.meals) m.dayOfWeek})
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(_dayNames[dayIdx], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                                      for (final m in p.meals.where((m) => m.dayOfWeek == dayIdx))
                                        Padding(
                                          padding: const EdgeInsets.only(left: 8, top: 2),
                                          child: Text(
                                            '${m.mealType} · ${m.foodItem.name} (${m.foodItem.calories} kcal)',
                                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class _MealRow {
  int key;
  int dayOfWeek = 1;
  String mealType = 'BREAKFAST';
  String? foodItemId;
  _MealRow({required this.key});
}

class _CreateDietPlanSheet extends ConsumerStatefulWidget {
  const _CreateDietPlanSheet();

  @override
  ConsumerState<_CreateDietPlanSheet> createState() => _CreateDietPlanSheetState();
}

class _CreateDietPlanSheetState extends ConsumerState<_CreateDietPlanSheet> {
  String? _memberId;
  final _nameController = TextEditingController();
  final _waterController = TextEditingController(text: '3000');
  final _supplementsController = TextEditingController();
  final _rows = <_MealRow>[_MealRow(key: 0)];
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _waterController.dispose();
    _supplementsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final validRows = _rows.where((r) => r.foodItemId != null).toList();
    if (_memberId == null || _nameController.text.trim().length < 2 || validRows.isEmpty) {
      setState(() => _error = 'Pick a member, name the plan, and add at least one meal.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(trainerRepositoryProvider).createDietPlan(
            memberId: _memberId!,
            name: _nameController.text.trim(),
            targetWaterMl: int.tryParse(_waterController.text),
            supplements: _supplementsController.text.trim().isEmpty ? null : _supplementsController.text.trim(),
            meals: validRows
                .map((r) => {'dayOfWeek': r.dayOfWeek, 'mealType': r.mealType, 'foodItemId': r.foodItemId})
                .toList(),
          );
      ref.invalidate(trainerDietPlansProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (e) {
      setState(() {
        _error = e is ApiException ? e.message : 'Could not create plan';
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final membersAsync = ref.watch(trainerMembersProvider);
    final foodsAsync = ref.watch(foodCatalogProvider(null));

    return Padding(
      padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('New Diet Plan', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            membersAsync.when(
              data: (members) => DropdownButtonFormField<String>(
                initialValue: _memberId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Member'),
                items: members.map((m) => DropdownMenuItem(value: m.id, child: Text(m.name))).toList(),
                onChanged: (v) => setState(() => _memberId = v),
              ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const Text('Could not load members', style: TextStyle(color: AppColors.danger)),
            ),
            const SizedBox(height: 12),
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Plan name')),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _waterController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Water target (ml)'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _supplementsController,
                    decoration: const InputDecoration(labelText: 'Supplements'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text('Meals', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            foodsAsync.when(
              data: (foods) => Column(
                children: [
                  for (final row in _rows)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<int>(
                              initialValue: row.dayOfWeek,
                              isDense: true,
                              isExpanded: true,
                              decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8)),
                              items: [
                                for (var i = 0; i < _dayNames.length; i++)
                                  DropdownMenuItem(value: i, child: Text(_dayNames[i].substring(0, 3))),
                              ],
                              onChanged: (v) => setState(() => row.dayOfWeek = v ?? 1),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: row.mealType,
                              isDense: true,
                              isExpanded: true,
                              decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8)),
                              items: _mealTypes.map((t) => DropdownMenuItem(value: t, child: Text(t.substring(0, 3)))).toList(),
                              onChanged: (v) => setState(() {
                                row.mealType = v ?? 'BREAKFAST';
                                row.foodItemId = null;
                              }),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            flex: 2,
                            child: DropdownButtonFormField<String>(
                              initialValue: row.foodItemId,
                              isDense: true,
                              isExpanded: true,
                              decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8)),
                              hint: const Text('Food'),
                              items: foods
                                  .where((f) => f.mealType == row.mealType)
                                  .map((f) => DropdownMenuItem(value: f.id, child: Text(f.name, overflow: TextOverflow.ellipsis)))
                                  .toList(),
                              onChanged: (v) => setState(() => row.foodItemId = v),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () => setState(() => _rows.remove(row)),
                          ),
                        ],
                      ),
                    ),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: () => setState(() => _rows.add(_MealRow(key: _rows.length))),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Add meal'),
                    ),
                  ),
                ],
              ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const Text('Could not load foods', style: TextStyle(color: AppColors.danger)),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _saving ? null : _submit,
              child: Text(_saving ? 'Saving...' : 'Create plan'),
            ),
          ],
        ),
      ),
    );
  }
}
