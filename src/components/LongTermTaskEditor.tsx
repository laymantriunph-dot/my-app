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
  normalizeLongTermCategory,
} from '../taskUtils';
import { colors, radii, shadows } from '../theme';
import type { Task } from '../types';

type LongTermTaskEditorProps = {
  visible: boolean;
  task: Task | null;
  categorySuggestions: string[];
  isSubmitting: boolean;
  onClose: () => void;
  onEditDefaults: () => void;
  onSave: (
    task: Task,
    category: string | null,
  ) => Promise<boolean>;
};

export function LongTermTaskEditor({
  visible,
  task,
  categorySuggestions,
  isSubmitting,
  onClose,
  onEditDefaults,
  onSave,
}: LongTermTaskEditorProps) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!visible || !task) return;
    setCategory(task.customCategory ?? '');
  }, [task, visible]);

  async function save() {
    if (!task) return;
    const saved = await onSave(
      task,
      normalizeLongTermCategory(category),
    );
    if (saved) onClose();
  }

  return (
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
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, 20) + 8 },
            ]}
          >
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>EDIT LONG VIEW</Text>
                <Text style={styles.title}>编辑遐筹分类</Text>
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

            <View style={styles.taskPreview}>
              <View style={styles.leafIcon}>
                <Ionicons
                  name="leaf-outline"
                  size={19}
                  color={colors.longTerm}
                />
              </View>
              <Text numberOfLines={2} style={styles.taskTitle}>
                {task?.title ?? ''}
              </Text>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionLabel}>分类</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onEditDefaults}
                style={styles.editDefaultsButton}
              >
                <Ionicons
                  name="options-outline"
                  size={12}
                  color={colors.inkSoft}
                />
                <Text style={styles.editDefaultsText}>编辑默认分类</Text>
              </Pressable>
            </View>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="留空表示暂不分类"
              placeholderTextColor={colors.inkFaint}
              maxLength={24}
              returnKeyType="done"
              style={styles.textInput}
            />
            {categorySuggestions.length > 0 ? (
              <View style={styles.suggestionRow}>
                {categorySuggestions.map((suggestion) => {
                  const selected = category === suggestion;
                  return (
                    <Pressable
                      key={suggestion}
                      accessibilityRole="button"
                      onPress={() => setCategory(selected ? '' : suggestion)}
                      style={[
                        styles.suggestionChip,
                        selected && styles.suggestionChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.suggestionText,
                          selected && styles.suggestionTextActive,
                        ]}
                      >
                        {suggestion}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <Text style={styles.helper}>
              分类用于整理长期事项，不会影响今日完成率。
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void save()}
              style={styles.saveButton}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>保存修改</Text>
                  <Ionicons name="checkmark" size={19} color={colors.white} />
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 27, 23, 0.38)',
  },
  sheet: {
    maxHeight: '90%',
    paddingTop: 10,
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
  content: {
    paddingHorizontal: 22,
  },
  headingRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headingCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.longTerm,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    marginTop: 5,
    color: colors.ink,
    fontSize: 25,
    fontWeight: '800',
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
  },
  taskPreview: {
    minHeight: 64,
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.longTermSoft,
  },
  leafIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  taskTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  sectionHeading: {
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  editDefaultsButton: {
    minHeight: 28,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  editDefaultsText: {
    color: colors.inkSoft,
    fontSize: 8,
    fontWeight: '700',
  },
  textInput: {
    height: 47,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
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
    minHeight: 29,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
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
  helper: {
    marginTop: 12,
    color: colors.inkFaint,
    fontSize: 9,
    lineHeight: 14,
  },
  saveButton: {
    height: 54,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
