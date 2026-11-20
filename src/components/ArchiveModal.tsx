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
import {
  ACTIVE_TASK_CATEGORIES,
  type TaskArchive,
} from '../types';

type ArchiveModalProps = {
  visible: boolean;
  archives: TaskArchive[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onDelete: (archives: TaskArchive[]) => Promise<boolean>;
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
  archives,
  isLoading,
  error,
  onClose,
  onDelete,
}: ArchiveModalProps) {
  const insets = useSafeAreaInsets();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedArchives = archives.filter((archive) =>
    selectedIds.has(archive.id),
  );
  const groupedArchives = ACTIVE_TASK_CATEGORIES.map((category) => ({
    category,
    archives: archives.filter(
      (archive) =>
        (archive.category === category ||
          (category === 'today' && archive.category === 'secondary')),
    ),
  }));

  function toggleSelected(archive: TaskArchive) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(archive.id)) next.delete(archive.id);
      else next.add(archive.id);
      return next;
    });
  }

  function cancelSelection() {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }

  function confirmDelete() {
    if (selectedArchives.length === 0) return;

    Alert.alert('抹除所选记录？', `将删除 ${selectedArchives.length} 条记录。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '抹除',
        style: 'destructive',
        onPress: () => {
          void onDelete(selectedArchives).then((removed) => {
            if (removed) cancelSelection();
          });
        },
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
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            cancelSelection();
            onClose();
          }}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 18) + 8 },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>THE WAY OF SUCCESS</Text>
              <Text style={styles.title}>走过的每一步</Text>
            </View>
            <View style={styles.headerActions}>
              {archives.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (isSelecting) cancelSelection();
                    else setIsSelecting(true);
                  }}
                  style={[
                    styles.eraseButton,
                    isSelecting && styles.eraseButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.eraseText,
                      isSelecting && styles.eraseTextActive,
                    ]}
                  >
                    {isSelecting ? '取消' : '抹除'}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="关闭"
                onPress={() => {
                  cancelSelection();
                  onClose();
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>
          </View>

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

          {isSelecting ? (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>
                已选择 {selectedArchives.length} 条记录
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={selectedArchives.length === 0}
                onPress={confirmDelete}
                style={[
                  styles.deleteSelectedButton,
                  selectedArchives.length === 0 &&
                    styles.deleteSelectedDisabled,
                ]}
              >
                <Ionicons name="trash-outline" size={15} color={colors.white} />
                <Text style={styles.deleteSelectedText}>抹除所选</Text>
              </Pressable>
            </View>
          ) : null}

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
              groupedArchives.map((group) => {
                const meta = CATEGORY_META[group.category];

                return (
                  <View key={group.category} style={styles.archiveGroup}>
                    <View style={styles.groupHeader}>
                      <View
                        style={[
                          styles.groupIcon,
                          { backgroundColor: meta.softColor },
                        ]}
                      >
                        <Ionicons
                          name={meta.icon}
                          size={16}
                          color={meta.color}
                        />
                      </View>
                      <Text style={styles.groupTitle}>{meta.label}</Text>
                      <Text style={styles.groupCount}>
                        {group.archives.length} 条记录
                      </Text>
                    </View>

                    {group.archives.length === 0 ? (
                      <View style={styles.groupEmpty}>
                        <Text style={styles.groupEmptyText}>
                          暂无{meta.label}完成记录
                        </Text>
                      </View>
                    ) : (
                      group.archives.map((archive) => {
                        const selected = selectedIds.has(archive.id);

                        return (
                          <Pressable
                            key={archive.id}
                            accessibilityRole={
                              isSelecting ? 'checkbox' : undefined
                            }
                            accessibilityState={
                              isSelecting ? { checked: selected } : undefined
                            }
                            disabled={!isSelecting}
                            onPress={() => toggleSelected(archive)}
                            style={[
                              styles.archiveCard,
                              selected && styles.archiveCardSelected,
                            ]}
                          >
                            {isSelecting ? (
                              <View
                                style={[
                                  styles.selectionCircle,
                                  selected && styles.selectionCircleActive,
                                ]}
                              >
                                {selected ? (
                                  <Ionicons
                                    name="checkmark"
                                    size={14}
                                    color={colors.white}
                                  />
                                ) : null}
                              </View>
                            ) : null}
                            <View style={styles.archiveCopy}>
                              <Text style={styles.archiveTitle}>
                                {archive.title}
                              </Text>
                              <Text style={styles.archiveMeta}>
                                {formatArchiveDate(archive.archivedAt)} ·{' '}
                                {archive.taskCount} 项完成
                              </Text>
                              <Text
                                numberOfLines={2}
                                style={styles.archivePreview}
                              >
                                {archive.tasks
                                  .map((task) => task.title)
                                  .join(' · ')}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })
                    )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  eraseButton: {
    height: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  eraseButtonActive: {
    backgroundColor: '#F1E5DB',
  },
  eraseText: {
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  eraseTextActive: {
    color: colors.danger,
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
  selectionBar: {
    minHeight: 48,
    marginTop: 14,
    paddingLeft: 13,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.sm,
    backgroundColor: '#F1E5DB',
  },
  selectionText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteSelectedButton: {
    height: 34,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 11,
    backgroundColor: colors.danger,
  },
  deleteSelectedDisabled: {
    opacity: 0.35,
  },
  deleteSelectedText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  historyScroll: {
    flexGrow: 0,
    maxHeight: 400,
  },
  historyContent: {
    paddingTop: 13,
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
  archiveGroup: {
    marginBottom: 19,
  },
  groupHeader: {
    minHeight: 34,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  groupCount: {
    color: colors.inkFaint,
    fontSize: 9,
  },
  groupEmpty: {
    minHeight: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  groupEmptyText: {
    color: colors.inkFaint,
    fontSize: 10,
  },
  archiveCard: {
    minHeight: 84,
    marginBottom: 9,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  archiveCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  selectionCircleActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary,
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
});
