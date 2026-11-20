import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_META } from '../taskUtils';
import { colors, radii, shadows } from '../theme';
import type { Task, TaskArchive, TaskCategory } from '../types';

type ArchiveModalProps = {
  visible: boolean;
  category: TaskCategory;
  currentTasks: Task[];
  archives: TaskArchive[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (category: TaskCategory, tasks: Task[]) => Promise<boolean>;
  onDelete: (archive: TaskArchive) => Promise<boolean>;
};

function formatArchiveDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ArchiveModal({
  visible,
  category,
  currentTasks,
  archives,
  isLoading,
  error,
  onClose,
  onSave,
  onDelete,
}: ArchiveModalProps) {
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  const meta = CATEGORY_META[category];

  async function saveCurrent() {
    setIsSaving(true);
    const saved = await onSave(category, currentTasks);
    setIsSaving(false);

    if (saved) {
      Alert.alert('已保存', '这份清单已存入历史，当前待办不会被删除。');
    }
  }

  function confirmDelete(archive: TaskArchive) {
    Alert.alert('删除这份存档？', archive.title, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => void onDelete(archive),
      },
    ]);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
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
              <Text style={styles.eyebrow}>HISTORY</Text>
              <Text style={styles.title}>待办存档</Text>
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

          <Pressable
            accessibilityRole="button"
            disabled={isSaving || currentTasks.length === 0}
            onPress={() => void saveCurrent()}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: meta.color },
              (isSaving || currentTasks.length === 0) &&
                styles.saveButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="archive-outline" size={19} color={colors.white} />
            )}
            <View style={styles.saveCopy}>
              <Text style={styles.saveTitle}>保存当前{meta.label}清单</Text>
              <Text style={styles.saveHint}>
                {currentTasks.length > 0
                  ? `${currentTasks.length} 项 · 不会清除当前待办`
                  : '当前分类还没有待办'}
              </Text>
            </View>
          </Pressable>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle-outline"
                size={17}
                color={colors.danger}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>历史清单</Text>
          <ScrollView
            style={styles.historyScroll}
            contentContainerStyle={styles.historyContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.loadingText}>正在读取存档…</Text>
              </View>
            ) : archives.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="albums-outline"
                  size={28}
                  color={colors.inkFaint}
                />
                <Text style={styles.emptyTitle}>还没有历史清单</Text>
                <Text style={styles.emptyText}>
                  保存后，这里会留下当时的任务快照。
                </Text>
              </View>
            ) : (
              archives.map((archive) => {
                const archiveMeta = CATEGORY_META[archive.category];

                return (
                  <View key={archive.id} style={styles.archiveCard}>
                    <View
                      style={[
                        styles.archiveIcon,
                        { backgroundColor: archiveMeta.softColor },
                      ]}
                    >
                      <Ionicons
                        name={archiveMeta.icon}
                        size={17}
                        color={archiveMeta.color}
                      />
                    </View>
                    <View style={styles.archiveCopy}>
                      <Text style={styles.archiveTitle}>{archive.title}</Text>
                      <Text style={styles.archiveMeta}>
                        {formatArchiveDate(archive.archivedAt)} ·{' '}
                        {archive.completedCount}/{archive.taskCount} 已完成
                      </Text>
                      <Text numberOfLines={2} style={styles.archivePreview}>
                        {archive.tasks.map((task) => task.title).join(' · ')}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="删除存档"
                      hitSlop={8}
                      onPress={() => confirmDelete(archive)}
                      style={styles.deleteButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color={colors.inkFaint}
                      />
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
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
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  saveButton: {
    minHeight: 68,
    marginTop: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.md,
  },
  saveButtonDisabled: {
    opacity: 0.38,
  },
  buttonPressed: {
    opacity: 0.78,
  },
  saveCopy: {
    flex: 1,
  },
  saveTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  saveHint: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
  },
  errorBanner: {
    marginTop: 11,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: radii.sm,
    backgroundColor: '#F8E4DF',
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 11,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  historyScroll: {
    flexGrow: 0,
    maxHeight: 400,
  },
  historyContent: {
    gap: 9,
    paddingBottom: 12,
  },
  loading: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  loadingText: {
    color: colors.inkSoft,
    fontSize: 11,
  },
  empty: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  emptyTitle: {
    marginTop: 9,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 4,
    color: colors.inkFaint,
    fontSize: 10,
  },
  archiveCard: {
    minHeight: 84,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  archiveIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveCopy: {
    flex: 1,
  },
  archiveTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  archiveMeta: {
    marginTop: 4,
    color: colors.inkFaint,
    fontSize: 10,
  },
  archivePreview: {
    marginTop: 6,
    color: colors.inkSoft,
    fontSize: 10,
    lineHeight: 15,
  },
  deleteButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
