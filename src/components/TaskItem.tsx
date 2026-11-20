import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CATEGORY_META, PRIORITY_META } from '../taskUtils';
import { colors, radii } from '../theme';
import type { Task } from '../types';

type TaskItemProps = {
  task: Task;
  disabled?: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

export function TaskItem({
  task,
  disabled = false,
  onToggle,
  onDelete,
}: TaskItemProps) {
  const meta = CATEGORY_META[task.category];
  const priorityMeta = PRIORITY_META[task.priority];
  const markerColor =
    task.category === 'today' ? priorityMeta.color : meta.color;
  const categoryLabel =
    task.category === 'today'
      ? `${meta.label} · ${priorityMeta.label}`
      : meta.label;

  return (
    <View style={[styles.container, task.isCompleted && styles.completedContainer]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.isCompleted }}
        accessibilityLabel={task.isCompleted ? '标记为未完成' : '标记为已完成'}
        disabled={disabled}
        onPress={onToggle}
        hitSlop={8}
        style={[
          styles.checkButton,
          {
            borderColor: task.isCompleted ? markerColor : colors.line,
            backgroundColor: task.isCompleted ? markerColor : 'transparent',
          },
        ]}
      >
        {task.isCompleted ? (
          <Ionicons name="checkmark" size={17} color={colors.white} />
        ) : null}
      </Pressable>

      <View style={styles.content}>
        <Text
          numberOfLines={2}
          style={[styles.title, task.isCompleted && styles.completedTitle]}
        >
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.categoryDot, { backgroundColor: markerColor }]} />
          <Text style={styles.categoryLabel}>{categoryLabel}</Text>
          <Text style={styles.metaDivider}>·</Text>
          <Text style={styles.categoryHint}>
            {task.isCompleted
              ? '已完成'
              : task.category === 'today'
                ? priorityMeta.hint
                : meta.hint}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="delete task"
        disabled={disabled}
        hitSlop={8}
        onPress={onDelete}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.deleteButtonPressed,
        ]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.inkFaint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  completedContainer: {
    backgroundColor: 'rgba(255,252,246,0.56)',
  },
  checkButton: {
    width: 27,
    height: 27,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 7,
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  completedTitle: {
    color: colors.inkFaint,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryLabel: {
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  metaDivider: {
    color: colors.inkFaint,
    fontSize: 11,
  },
  categoryHint: {
    color: colors.inkFaint,
    fontSize: 11,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
});
