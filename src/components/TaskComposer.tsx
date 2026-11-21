import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CATEGORY_META,
  getLocalDateKey,
  normalizeLongTermCategory,
  normalizeTaskTags,
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
    customCategory: string | null,
    tags: string[],
  ) => Promise<boolean>;
};

const LONG_TERM_CATEGORY_SUGGESTIONS = ['备考', '锻炼', '阅读', '创作', '生活'];

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
  const [longTermCategory, setLongTermCategory] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);
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
      setLongTermCategory('');
      setTagDraft('');
      setTags([]);
      setShowDatePicker(false);
    }
  }, [initialCategory, initialDate, visible]);

  async function submit() {
    const effectiveDate =
      category === 'longTerm' ? getLocalDateKey() : scheduledDate;
    const customCategory =
      category === 'longTerm'
        ? normalizeLongTermCategory(longTermCategory)
        : null;
    const submittedTags =
      category === 'longTerm'
        ? normalizeTaskTags([
            ...tags,
            ...tagDraft.split(/[,，、\s]+/).filter(Boolean),
          ])
        : [];
    const didSave = await onSubmit(
      title,
      category,
      priority,
      effectiveDate,
      customCategory,
      submittedTags,
    );

    if (didSave) {
      onClose();
    }
  }

  function addTags() {
    const nextTags = normalizeTaskTags([
      ...tags,
      ...tagDraft.split(/[,，、\s]+/).filter(Boolean),
    ]);
    setTags(nextTags);
    setTagDraft('');
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
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.sheetContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 8 },
            ]}
          >
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

          {category === 'longTerm' ? (
            <View style={styles.longTermSection}>
              <View style={styles.longTermHeading}>
                <Text style={styles.longTermLabel}>分类</Text>
                <Text style={styles.longTermOptional}>可选</Text>
              </View>
              <TextInput
                value={longTermCategory}
                onChangeText={setLongTermCategory}
                placeholder="例如：备考、锻炼、阅读"
                placeholderTextColor={colors.inkFaint}
                maxLength={24}
                returnKeyType="done"
                style={styles.longTermInput}
              />
              <View style={styles.suggestionRow}>
                {LONG_TERM_CATEGORY_SUGGESTIONS.map((suggestion) => {
                  const isSelected = longTermCategory === suggestion;
                  return (
                    <Pressable
                      key={suggestion}
                      accessibilityRole="button"
                      onPress={() =>
                        setLongTermCategory(isSelected ? '' : suggestion)
                      }
                      style={[
                        styles.suggestionChip,
                        isSelected && styles.suggestionChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.suggestionText,
                          isSelected && styles.suggestionTextActive,
                        ]}
                      >
                        {suggestion}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.tagHeading}>
                <Text style={styles.longTermLabel}>标签</Text>
                <Text style={styles.longTermOptional}>最多 8 个</Text>
              </View>
              <View style={styles.tagInputRow}>
                <TextInput
                  value={tagDraft}
                  onChangeText={setTagDraft}
                  placeholder="输入标签，例如：英语、每天"
                  placeholderTextColor={colors.inkFaint}
                  maxLength={60}
                  returnKeyType="done"
                  onSubmitEditing={addTags}
                  style={styles.tagInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="添加标签"
                  disabled={!tagDraft.trim() || tags.length >= 8}
                  onPress={addTags}
                  style={[
                    styles.addTagButton,
                    (!tagDraft.trim() || tags.length >= 8) &&
                      styles.addTagButtonDisabled,
                  ]}
                >
                  <Ionicons name="add" size={20} color={colors.white} />
                </Pressable>
              </View>
              {tags.length > 0 ? (
                <View style={styles.tagList}>
                  {tags.map((tag) => (
                    <Pressable
                      key={tag}
                      accessibilityRole="button"
                      accessibilityLabel={`移除标签 ${tag}`}
                      onPress={() =>
                        setTags((current) =>
                          current.filter((item) => item !== tag),
                        )
                      }
                      style={styles.tagChip}
                    >
                      <Text style={styles.tagChipText}>#{tag}</Text>
                      <Ionicons name="close" size={12} color={colors.accent} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Text style={styles.longTermHelper}>
                分类和标签只用于整理长期事项，不会影响今日完成率。
              </Text>
            </View>
          ) : null}

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
          </ScrollView>
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.canvas,
    ...shadows.card,
  },
  sheetContent: {
    paddingHorizontal: 22,
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
  longTermSection: {
    marginTop: 15,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.longTermSoft,
    borderWidth: 1,
    borderColor: '#D3E2DB',
  },
  longTermHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  longTermLabel: {
    color: colors.longTerm,
    fontSize: 11,
    fontWeight: '800',
  },
  longTermOptional: {
    color: colors.inkFaint,
    fontSize: 9,
  },
  longTermInput: {
    height: 46,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D3E2DB',
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    minHeight: 28,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D3E2DB',
  },
  suggestionChipActive: {
    backgroundColor: colors.longTerm,
    borderColor: colors.longTerm,
  },
  suggestionText: {
    color: colors.longTerm,
    fontSize: 9,
    fontWeight: '700',
  },
  suggestionTextActive: {
    color: colors.white,
  },
  tagHeading: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagInputRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 7,
  },
  tagInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D3E2DB',
    color: colors.ink,
    fontSize: 12,
  },
  addTagButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.longTerm,
  },
  addTagButtonDisabled: {
    opacity: 0.32,
  },
  tagList: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    minHeight: 28,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  tagChipText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '700',
  },
  longTermHelper: {
    marginTop: 10,
    color: colors.inkFaint,
    fontSize: 9,
    lineHeight: 14,
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
