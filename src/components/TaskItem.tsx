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

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

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

      <View
        style={[
          styles.content,
          !task.isCompleted && task.category === 'today' && styles.contentOnly,
        ]}
      >
        <Text
          numberOfLines={2}
          style={[styles.title, task.isCompleted && styles.completedTitle]}
        >
          {task.title}
        </Text>
        {task.isCompleted || task.category === 'longTerm' ? (
          <View style={styles.metaRow}>
            {task.isCompleted ? (
              <>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: markerColor },
                  ]}
                />
                <Text style={styles.categoryLabel}>{categoryLabel}</Text>
                <Text style={styles.metaDivider}>·</Text>
                <Text style={styles.categoryHint}>已完成</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={colors.inkFaint}
                />
                <Text style={styles.creationTime}>
                  创作于 {formatCreatedAt(task.createdAt)}
                </Text>
              </>
            )}
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="泯迹 task"
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
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  completedContainer: {
    backgroundColor: 'rgba(255,252,246,0.56)',
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  contentOnly: {
    gap: 0,
  },
  title: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
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
    fontSize: 10,
    fontWeight: '700',
  },
  metaDivider: {
    color: colors.inkFaint,
    fontSize: 10,
  },
  categoryHint: {
    color: colors.inkFaint,
    fontSize: 10,
  },
  creationTime: {
    color: colors.inkFaint,
    fontSize: 9,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
});
