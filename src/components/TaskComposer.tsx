import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CATEGORY_META,
  getLocalDateKey,
  PRIORITY_META,
} from '../taskUtils';
import { colors, radii, shadows } from '../theme';
import {
  ACTIVE_TASK_CATEGORIES,
  type TaskCategory,
  type TaskPriority,
} from '../types';
import { PlannerModal } from './PlannerModal';

type TaskComposerProps = {
  visible: boolean;
  initialCategory: TaskCategory;
  initialDate: string;
  isSubmitting: boolean;
  onClose: () => void;
  onCategoryChange: (category: TaskCategory) => void;
  onSubmit: (
    title: string,
    category: TaskCategory,
    priority: TaskPriority,
    scheduledDate: string,
  ) => Promise<boolean>;
};

export function TaskComposer({
  visible,
  initialCategory,
  initialDate,
  isSubmitting,
  onClose,
  onCategoryChange,
  onSubmit,
}: TaskComposerProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>(initialCategory);
  const [priority, setPriority] = useState<TaskPriority>('primary');
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const selectedDateLabel = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${scheduledDate}T12:00:00`));

  useEffect(() => {
    if (visible) {
      setTitle('');
      setCategory(initialCategory);
      setPriority('primary');
      setScheduledDate(initialDate);
      setShowDatePicker(false);
    }
  }, [initialCategory, initialDate, visible]);

  async function submit() {
    const effectiveDate =
      category === 'longTerm' ? getLocalDateKey() : scheduledDate;
    const didSave = await onSubmit(
      title,
      category,
      priority,
      effectiveDate,
    );

    if (didSave) {
      onClose();
    }
  }

  return (
    <>
      <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) + 8 },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.headingRow}>
            <View>
              <Text style={styles.eyebrow}>NEW TASK</Text>
              <Text style={styles.heading}>放进哪一栏？</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="关闭"
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.ink} />
            </Pressable>
          </View>

          <TextInput
            autoFocus
            value={title}
            onChangeText={setTitle}
            placeholder="例如：完成项目首页草图"
            placeholderTextColor={colors.inkFaint}
            returnKeyType="done"
            multiline
            maxLength={160}
            onSubmitEditing={() => void submit()}
            style={styles.input}
          />

          <View style={styles.categories}>
            {ACTIVE_TASK_CATEGORIES.map((key) => {
              const meta = CATEGORY_META[key];
              const isSelected = key === category;

              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    setCategory(key);
                    if (key === 'longTerm') setShowDatePicker(false);
                    onCategoryChange(key);
                  }}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: isSelected
                        ? meta.softColor
                        : colors.surface,
                      borderColor: isSelected ? meta.color : colors.line,
                    },
                  ]}
                >
                  <Ionicons
                    name={meta.icon}
                    size={18}
                    color={isSelected ? meta.color : colors.inkFaint}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      { color: isSelected ? meta.color : colors.inkSoft },
                    ]}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {category === 'today' ? (
            <View style={styles.prioritySection}>
              <Text style={styles.priorityLabel}>重要程度</Text>
              <View style={styles.priorityRow}>
                {(['primary', 'secondary'] as const).map((key) => {
                  const meta = PRIORITY_META[key];
                  const isSelected = priority === key;

                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setPriority(key)}
                      style={[
                        styles.priorityButton,
                        {
                          backgroundColor: isSelected
                            ? meta.softColor
                            : colors.surface,
                          borderColor: isSelected
                            ? meta.color
                            : colors.line,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityName,
                          { color: isSelected ? meta.color : colors.inkSoft },
                        ]}
                      >
                        {meta.label}
                      </Text>
                      <Text style={styles.priorityHint}>{meta.hint}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {category === 'today' ? (
            <View style={styles.scheduleSection}>
            <View style={styles.scheduleHeading}>
              <Text style={styles.scheduleLabel}>安排日期</Text>
              <Text style={styles.scheduleHint}>
                到这一天才会进入清单与进度
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowDatePicker(true)}
              style={styles.scheduleButton}
            >
              <View style={styles.scheduleButtonIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.longTerm}
                />
              </View>
              <View style={styles.scheduleButtonCopy}>
                <Text style={styles.scheduleButtonTitle}>
                  {scheduledDate === getLocalDateKey()
                    ? '今天'
                    : selectedDateLabel}
                </Text>
                <Text style={styles.scheduleButtonHint}>
                  点击修改安排日期
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
            </Pressable>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!title.trim() || isSubmitting}
            onPress={() => void submit()}
            style={({ pressed }) => [
              styles.submitButton,
              (!title.trim() || isSubmitting) && styles.submitButtonDisabled,
              pressed && styles.submitButtonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.submitText}>
                  {category === 'longTerm'
                    ? '加入遐筹'
                    : scheduledDate === getLocalDateKey()
                      ? '加入谋篇'
                      : `安排到 ${selectedDateLabel}`}
                </Text>
                <Ionicons name="arrow-up" size={19} color={colors.white} />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      </Modal>
      <PlannerModal
        visible={showDatePicker}
        selectedDate={scheduledDate}
        tasks={[]}
        mode="picker"
        onClose={() => setShowDatePicker(false)}
        onSelect={setScheduledDate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 27, 23, 0.35)',
  },
  sheet: {
    maxHeight: '94%',
    paddingTop: 10,
    paddingHorizontal: 22,
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
  headingRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  heading: {
    marginTop: 5,
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  input: {
    minHeight: 92,
    maxHeight: 130,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  categories: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },
  categoryButton: {
    flex: 1,
    minHeight: 62,
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  prioritySection: {
    marginTop: 14,
  },
  priorityLabel: {
    marginBottom: 7,
    color: colors.inkSoft,
    fontSize: 10,
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  priorityName: {
    fontSize: 12,
    fontWeight: '800',
  },
  priorityHint: {
    marginTop: 3,
    color: colors.inkFaint,
    fontSize: 9,
  },
  scheduleSection: {
    marginTop: 16,
  },
  scheduleHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  scheduleHint: {
    color: colors.inkFaint,
    fontSize: 8,
  },
  scheduleButton: {
    minHeight: 54,
    marginTop: 8,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
  },
  scheduleButtonIcon: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  scheduleButtonCopy: {
    flex: 1,
  },
  scheduleButtonTitle: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  scheduleButtonHint: {
    marginTop: 3,
    color: colors.inkFaint,
    fontSize: 8,
  },
  dayRail: {
    gap: 7,
    paddingTop: 8,
    paddingBottom: 2,
  },
  dayButton: {
    width: 57,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayButtonSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dayLabel: {
    color: colors.inkSoft,
    fontSize: 9,
    fontWeight: '700',
  },
  dayLabelSelected: {
    color: '#E7DDC8',
  },
  dayDate: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  dayDateSelected: {
    color: colors.white,
  },
  submitButton: {
    height: 56,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
  },
  submitButtonDisabled: {
    opacity: 0.32,
  },
  submitButtonPressed: {
    opacity: 0.78,
  },
  submitText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
