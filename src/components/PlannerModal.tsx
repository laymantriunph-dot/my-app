import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLocalDateKey } from '../taskUtils';
import { colors, radii, shadows } from '../theme';
import type { Task } from '../types';

type PlannerModalProps = {
  visible: boolean;
  selectedDate: string;
  tasks: Task[];
  onClose: () => void;
  onSelect: (date: string) => void;
};

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function PlannerModal({
  visible,
  selectedDate,
  tasks,
  onClose,
  onSelect,
}: PlannerModalProps) {
  const insets = useSafeAreaInsets();
  const selected = new Date(`${selectedDate}T12:00:00`);
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected));
  const todayKey = getLocalDateKey();
  const todayMonth = startOfMonth(new Date());

  useEffect(() => {
    if (visible) {
      setViewMonth(startOfMonth(new Date(`${selectedDate}T12:00:00`)));
    }
  }, [selectedDate, visible]);

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = daysInMonth(year, month);
    const result: (Date | null)[] = Array.from(
      { length: firstOffset },
      () => null,
    );

    for (let day = 1; day <= total; day += 1) {
      result.push(new Date(year, month, day, 12));
    }

    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [viewMonth]);

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const task of tasks) {
      if (task.isCompleted) continue;
      if (task.scheduledDate < todayKey) {
        counts[todayKey] = (counts[todayKey] ?? 0) + 1;
      } else {
        counts[task.scheduledDate] = (counts[task.scheduledDate] ?? 0) + 1;
      }
    }

    return counts;
  }, [tasks, todayKey]);

  function changeMonth(offset: number) {
    setViewMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
    );
  }

  const canGoBack =
    viewMonth.getFullYear() > todayMonth.getFullYear() ||
    (viewMonth.getFullYear() === todayMonth.getFullYear() &&
      viewMonth.getMonth() > todayMonth.getMonth());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 18) + 8 },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>CALENDAR</Text>
              <Text style={styles.title}>安排未来</Text>
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

          <Text style={styles.hint}>
            选择日期查看计划；新建任务时也可以设置未来日期。
          </Text>

          <View style={styles.monthHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="上个月"
              disabled={!canGoBack}
              onPress={() => changeMonth(-1)}
              style={[styles.monthButton, !canGoBack && styles.disabled]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.inkSoft} />
            </Pressable>
            <Text style={styles.monthLabel}>
              {viewMonth.getFullYear()} / {viewMonth.getMonth() + 1}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="下个月"
              onPress={() => changeMonth(1)}
              style={styles.monthButton}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekdayLabels.map((label) => (
              <Text key={label} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.cell} />;
              }

              const key = getLocalDateKey(date);
              const isSelected = key === selectedDate;
              const isToday = key === todayKey;
              const isPast = key < todayKey;
              const count = taskCounts[key] ?? 0;

              return (
                <View key={key} style={styles.cell}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isPast}
                    onPress={() => {
                      onSelect(key);
                      onClose();
                    }}
                    style={[
                      styles.dayCell,
                      isToday && styles.todayCell,
                      isSelected && styles.selectedCell,
                      isPast && styles.pastCell,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isToday && styles.todayNumber,
                        isSelected && styles.selectedNumber,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {count > 0 ? (
                      <View
                        style={[
                          styles.taskDot,
                          isSelected && styles.taskDotSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskDotText,
                            isSelected && styles.taskDotTextSelected,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onSelect(todayKey);
              onClose();
            }}
            style={styles.todayButton}
          >
            <Ionicons name="locate-outline" size={17} color={colors.ink} />
            <Text style={styles.todayButtonText}>回到今天</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 27, 23, 0.38)',
  },
  sheet: {
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.canvas,
    ...shadows.card,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  header: {
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    marginTop: 5,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 27,
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
  hint: {
    marginTop: 8,
    color: colors.inkSoft,
    fontSize: 10,
    lineHeight: 16,
  },
  monthHeader: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  disabled: {
    opacity: 0.3,
  },
  monthLabel: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },
  weekRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  weekLabel: {
    width: '14.2857%',
    color: colors.inkFaint,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.2857%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    width: 38,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  selectedCell: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pastCell: {
    opacity: 0.2,
  },
  dayNumber: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  todayNumber: {
    color: colors.accent,
  },
  selectedNumber: {
    color: colors.white,
  },
  taskDot: {
    position: 'absolute',
    right: 0,
    top: 0,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: colors.accentSoft,
  },
  taskDotSelected: {
    backgroundColor: '#E8DDC6',
  },
  taskDotText: {
    color: colors.accent,
    fontSize: 7,
    fontWeight: '800',
  },
  taskDotTextSelected: {
    color: colors.ink,
  },
  todayButton: {
    height: 48,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  todayButtonText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
});
