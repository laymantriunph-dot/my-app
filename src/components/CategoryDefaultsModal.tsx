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

import { normalizeCategoryDefaults } from '../hooks/useLongTermCategoryDefaults';
import { normalizeLongTermCategory } from '../taskUtils';
import { colors, radii, shadows } from '../theme';

type CategoryDefaultsModalProps = {
  visible: boolean;
  categories: string[];
  onClose: () => void;
  onSave: (categories: string[]) => Promise<void>;
};

export function CategoryDefaultsModal({
  visible,
  categories,
  onClose,
  onSave,
}: CategoryDefaultsModalProps) {
  const insets = useSafeAreaInsets();
  const [draftCategories, setDraftCategories] = useState(categories);
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraftCategories(categories);
    setNewCategory('');
    setIsSaving(false);
  }, [categories, visible]);

  function updateCategory(index: number, value: string) {
    setDraftCategories((current) =>
      current.map((category, currentIndex) =>
        currentIndex === index ? value : category,
      ),
    );
  }

  function addCategory() {
    const category = normalizeLongTermCategory(newCategory);
    if (!category || draftCategories.length >= 8) return;
    setDraftCategories(
      normalizeCategoryDefaults([...draftCategories, category]),
    );
    setNewCategory('');
  }

  async function save() {
    setIsSaving(true);
    await onSave(normalizeCategoryDefaults(draftCategories));
    setIsSaving(false);
    onClose();
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
              <Text style={styles.eyebrow}>DEFAULT CATEGORIES</Text>
              <Text style={styles.title}>默认分类</Text>
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
          <Text style={styles.description}>
            这些分类会出现在添加和编辑遐筹时的快捷选项中。你仍可以在每条遐筹里输入新的分类。
          </Text>

          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {draftCategories.map((category, index) => (
              <View key={`${index}:${category}`} style={styles.categoryRow}>
                <View style={styles.folderIcon}>
                  <Ionicons
                    name="folder-outline"
                    size={16}
                    color={colors.longTerm}
                  />
                </View>
                <TextInput
                  value={category}
                  onChangeText={(value) => updateCategory(index, value)}
                  maxLength={24}
                  placeholder="分类名称"
                  placeholderTextColor={colors.inkFaint}
                  style={styles.categoryInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`移除默认分类 ${category}`}
                  onPress={() =>
                    setDraftCategories((current) =>
                      current.filter(
                        (_item, currentIndex) => currentIndex !== index,
                      ),
                    )
                  }
                  style={styles.removeButton}
                >
                  <Ionicons
                    name="close"
                    size={17}
                    color={colors.inkFaint}
                  />
                </Pressable>
              </View>
            ))}
            {draftCategories.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  暂无默认分类，你也可以只在每条遐筹里临时设置。
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.addRow}>
            <TextInput
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="添加一个新的默认分类"
              placeholderTextColor={colors.inkFaint}
              maxLength={24}
              returnKeyType="done"
              onSubmitEditing={addCategory}
              style={styles.addInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="添加默认分类"
              disabled={!newCategory.trim() || draftCategories.length >= 8}
              onPress={addCategory}
              style={[
                styles.addButton,
                (!newCategory.trim() || draftCategories.length >= 8) &&
                  styles.addButtonDisabled,
              ]}
            >
              <Ionicons name="add" size={21} color={colors.white} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => void save()}
            style={styles.saveButton}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.saveButtonText}>保存默认分类</Text>
                <Ionicons name="checkmark" size={19} color={colors.white} />
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
    backgroundColor: 'rgba(20, 27, 23, 0.38)',
  },
  sheet: {
    maxHeight: '88%',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
    fontSize: 26,
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
  description: {
    marginTop: 10,
    color: colors.inkSoft,
    fontSize: 11,
    lineHeight: 18,
  },
  list: {
    maxHeight: 330,
    marginTop: 14,
  },
  categoryRow: {
    minHeight: 52,
    marginBottom: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  folderIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.longTermSoft,
  },
  categoryInput: {
    flex: 1,
    height: 44,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  emptyState: {
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  emptyText: {
    color: colors.inkFaint,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  addRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 7,
  },
  addInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    color: colors.ink,
    fontSize: 12,
  },
  addButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.longTerm,
  },
  addButtonDisabled: {
    opacity: 0.3,
  },
  saveButton: {
    height: 54,
    marginTop: 14,
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
