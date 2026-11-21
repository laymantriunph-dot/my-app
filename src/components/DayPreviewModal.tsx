import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CATEGORY_META,
  getLocalDateKey,
  PRIORITY_META,
} from '../taskUtils';
import { colors, radii, shadows } from '../theme';
import type { Task } from '../types';

type DayPreviewModalProps = {
  visible: boolean;
  date: string;
  tasks: Task[];
  onClose: () => void;
  onAddTask: () => void;
};

export function DayPreviewModal({
  visible,
  date,
  tasks,
  onClose,
  onAddTask,
}: DayPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const todayKey = getLocalDateKey();
  const isToday = date === todayKey;
  const dayLabel = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(`${date}T12:00:00`));
  const dayTasks = tasks.filter(
    (task) =>
      !task.isCompleted &&
      (isToday
        ? task.scheduledDate <= todayKey
        : task.scheduledDate === date),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.panel,
            { marginBottom: Math.max(insets.bottom, 18) },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>DAY BRIEF</Text>
              <Text style={styles.title}>{isToday ? '今天' : dayLabel}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="关闭"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryNumber}>{dayTasks.length}</Text>
            <Text style={styles.summaryText}>项待办</Text>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {dayTasks.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={25}
                  color={colors.inkFaint}
                />
                <Text style={styles.emptyTitle}>这一天还没有安排</Text>
                <Text style={styles.emptyHint}>
                  主页面不会因此切换到该日期。
                </Text>
              </View>
            ) : (
              dayTasks.map((task) => {
                const meta = CATEGORY_META[task.category];
                const priority = PRIORITY_META[task.priority];

                return (
                  <View key={task.id} style={styles.task}>
                    <View
                      style={[
                        styles.taskMarker,
                        {
                          backgroundColor:
                            task.category === 'today'
                              ? priority.softColor
                              : meta.softColor,
                        },
                      ]}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={15}
                        color={
                          task.category === 'today'
                            ? priority.color
                            : meta.color
                        }
                      />
                    </View>
                    <View style={styles.taskCopy}>
                      <Text numberOfLines={2} style={styles.taskTitle}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskMeta}>
                        {task.category === 'today'
                          ? `${meta.label} · ${priority.label}`
                          : meta.label}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onAddTask}
            style={styles.addButton}
          >
            <Ionicons name="add" size={19} color={colors.white} />
            <Text style={styles.addText}>为这一天安排任务</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 84,
    paddingLeft: 12,
    paddingRight: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 27, 23, 0.32)',
  },
  panel: {
    width: '86%',
    maxWidth: 342,
    maxHeight: '72%',
    padding: 18,
    borderRadius: 26,
    backgroundColor: colors.canvas,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  title: {
    marginTop: 5,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
  },
  summary: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  summaryNumber: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '700',
  },
  summaryText: {
    color: colors.inkFaint,
    fontSize: 9,
  },
  list: {
    flexGrow: 0,
    maxHeight: 330,
  },
  listContent: {
    gap: 8,
    paddingTop: 12,
  },
  empty: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  emptyTitle: {
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyHint: {
    color: colors.inkFaint,
    fontSize: 9,
  },
  task: {
    minHeight: 62,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  taskMarker: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  taskCopy: {
    flex: 1,
  },
  taskTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  taskMeta: {
    marginTop: 3,
    color: colors.inkFaint,
    fontSize: 8,
  },
  addButton: {
    height: 48,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 15,
    backgroundColor: colors.ink,
  },
  addText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
});
