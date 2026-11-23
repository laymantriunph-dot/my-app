import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_META, PRIORITY_META } from '../taskUtils';
import { colors, radii, shadows } from '../theme';
import {
  ACTIVE_TASK_CATEGORIES,
  type Task,
  type TaskArchive,
} from '../types';

type ArchiveModalProps = {
  visible: boolean;
  archives: TaskArchive[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onDelete: (tasks: Task[]) => Promise<boolean>;
};

function formatArchiveDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

type ArchiveTaskCardProps = {
  task: Task;
  archivedAt: string;
  isSelecting: boolean;
  selected: boolean;
  onToggle: () => void;
};

function ArchiveTaskCard({
  task,
  archivedAt,
  isSelecting,
  selected,
  onToggle,
}: ArchiveTaskCardProps) {
  const meta = CATEGORY_META[task.category];
  const priorityMeta = PRIORITY_META[task.priority];
  const markerColor =
    task.category === 'today' ? priorityMeta.color : meta.color;
  const completedAt = task.completedAt ?? archivedAt;

  return (
    <Pressable
      accessibilityRole={isSelecting ? 'checkbox' : undefined}
      accessibilityState={isSelecting ? { checked: selected } : undefined}
      disabled={!isSelecting}
      onPress={onToggle}
      style={[styles.archiveCard, selected && styles.archiveCardSelected]}
    >
      {isSelecting ? (
        <View
          style={[
            styles.selectionCircle,
            selected && styles.selectionCircleActive,
          ]}
        >
          {selected ? (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          ) : null}
        </View>
      ) : (
        <View style={[styles.taskCheck, { backgroundColor: markerColor }]}>
          <Ionicons name="checkmark" size={16} color={colors.white} />
        </View>
      )}
      <View style={styles.archiveCopy}>
        <Text numberOfLines={2} style={styles.archiveCompletedTitle}>
          {task.title}
        </Text>
        {task.category === 'longTerm' && task.customCategory ? (
          <View style={styles.archiveLabels}>
            <View style={styles.archiveCategoryPill}>
              <Ionicons
                name="folder-outline"
                size={10}
                color={colors.longTerm}
              />
              <Text style={styles.archiveCategoryText}>
                {task.customCategory}
              </Text>
            </View>
          </View>
        ) : null}
        <Text style={styles.archiveMetaDate}>
          {formatArchiveDate(completedAt)}
        </Text>
      </View>
    </Pressable>
  );
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
  const archiveItems = archives.flatMap((archive) =>
    archive.tasks.map((task) => ({
      archive,
      task,
    })),
  );
  const selectedTasks = archiveItems
    .filter((item) => selectedIds.has(item.task.id))
    .map((item) => item.task);
  const groupedArchives = ACTIVE_TASK_CATEGORIES.map((category) => ({
    category,
    archives: archives.filter(
      (archive) =>
        (archive.category === category ||
          (category === 'today' && archive.category === 'secondary')),
    ),
  }));

  function toggleSelected(task: Task) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(task.id)) next.delete(task.id);
      else next.add(task.id);
      return next;
    });
  }

  function cancelSelection() {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }

  async function deleteSelected() {
    if (selectedTasks.length === 0) return;
    const removed = await onDelete(selectedTasks);
    if (removed) cancelSelection();
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
              <Text style={styles.eyebrow}>ACCOMPLISHED</Text>
              <Text style={styles.title}>已完成</Text>
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
                    {isSelecting ? 'cancel' : '泯迹'}
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
                已选择 {selectedTasks.length} 个任务
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={selectedTasks.length === 0}
                onPress={() => void deleteSelected()}
                style={[
                  styles.deleteSelectedButton,
                  selectedTasks.length === 0 &&
                    styles.deleteSelectedDisabled,
                ]}
              >
                <Ionicons name="trash-outline" size={15} color={colors.white} />
                <Text style={styles.deleteSelectedText}>泯迹所选</Text>
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
                  完成任务后，这里会按分类自动留下记录。
                </Text>
              </View>
            ) : (
              <View style={styles.archiveColumns}>
                {groupedArchives.map((group) => {
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
                        {group.archives.reduce(
                          (total, archive) => total + archive.tasks.length,
                          0,
                        )}{' '}
                        项任务
                      </Text>
                    </View>

                    {(() => {
                      const items = group.archives.flatMap((archive) =>
                        archive.tasks.map((task) => ({ archive, task })),
                      );
                      const sections =
                        group.category === 'today'
                          ? [
                              {
                                key: 'primary',
                                label: 'Primary',
                                items: items.filter(
                                  (item) =>
                                    item.task.priority === 'primary',
                                ),
                              },
                              {
                                key: 'secondary',
                                label: 'Secondly.',
                                items: items.filter(
                                  (item) =>
                                    item.task.priority === 'secondary',
                                ),
                              },
                            ]
                          : [{ key: 'longTerm', label: '', items }];

                      return sections.map((section) => (
                        <View key={section.key} style={styles.priorityGroup}>
                          {section.label ? (
                            <View style={styles.priorityHeader}>
                              <Text style={styles.priorityTitle}>
                                {section.label}
                              </Text>
                              <Text style={styles.priorityCount}>
                                {section.items.length}
                              </Text>
                            </View>
                          ) : null}
                          {section.items.length === 0 ? (
                            <View style={styles.groupEmpty}>
                              <Text style={styles.groupEmptyText}>
                                暂无{section.label || meta.label}记录
                              </Text>
                            </View>
                          ) : (
                            section.items.map(({ archive, task }) => (
                              <ArchiveTaskCard
                                key={`${archive.id}:${task.id}`}
                                task={task}
                                archivedAt={archive.archivedAt}
                                isSelecting={isSelecting}
                                selected={selectedIds.has(task.id)}
                                onToggle={() => toggleSelected(task)}
                              />
                            ))
                          )}
                        </View>
                      ));
                    })()}
                    </View>
                  );
                })}
              </View>
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
  archiveColumns: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  archiveGroup: {
    flex: 1,
    minHeight: 280,
    marginBottom: 4,
    padding: 12,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 252, 246, 0.62)',
    borderWidth: 1,
    borderColor: colors.line,
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
  priorityGroup: {
    marginBottom: 11,
  },
  priorityHeader: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  priorityTitle: {
    color: colors.inkSoft,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  priorityCount: {
    minWidth: 17,
    height: 17,
    paddingHorizontal: 5,
    borderRadius: 9,
    color: colors.inkFaint,
    backgroundColor: colors.surfaceMuted,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 17,
  },
  archiveCard: {
    minHeight: 82,
    marginBottom: 9,
    paddingVertical: 13,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 7,
  },
  taskCheck: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  archiveCompletedTitle: {
    color: colors.inkFaint,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textDecorationLine: 'line-through',
  },
  archiveLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  archiveCategoryPill: {
    minHeight: 21,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.longTermSoft,
  },
  archiveCategoryText: {
    color: colors.longTerm,
    fontSize: 8,
    fontWeight: '800',
  },
  archiveMetaDate: {
    color: colors.inkFaint,
    fontSize: 9,
  },
});
