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

import { CATEGORY_META } from '../taskUtils';
import { colors, radii, shadows } from '../theme';
import { TASK_CATEGORIES, type TaskCategory } from '../types';

type TaskComposerProps = {
  visible: boolean;
  initialCategory: TaskCategory;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (title: string, category: TaskCategory) => Promise<boolean>;
};

export function TaskComposer({
  visible,
  initialCategory,
  isSubmitting,
  onClose,
  onSubmit,
}: TaskComposerProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>(initialCategory);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setCategory(initialCategory);
    }
  }, [initialCategory, visible]);

  async function submit() {
    const didSave = await onSubmit(title, category);

    if (didSave) {
      onClose();
    }
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
            {TASK_CATEGORIES.map((key) => {
              const meta = CATEGORY_META[key];
              const isSelected = key === category;

              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setCategory(key)}
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
                <Text style={styles.submitText}>加入清单</Text>
                <Ionicons name="arrow-up" size={19} color={colors.white} />
              </>
            )}
          </Pressable>
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
    backgroundColor: 'rgba(20, 27, 23, 0.35)',
  },
  sheet: {
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
