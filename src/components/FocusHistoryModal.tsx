import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, shadows } from '../theme';
import type { FocusSession, TimerMode } from '../types';

type Filter = 'all' | TimerMode;

type FocusHistoryModalProps = {
  visible: boolean;
  sessions: FocusSession[];
  onClose: () => void;
  onDelete: (sessions: FocusSession[]) => Promise<boolean>;
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function FocusHistoryModal({
  visible,
  sessions,
  onClose,
  onDelete,
}: FocusHistoryModalProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const filtered =
    filter === 'all'
      ? sessions
      : sessions.filter((session) => session.mode === filter);
  const selected = sessions.filter((session) => selectedIds.has(session.id));

  function toggleSelected(session: FocusSession) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(session.id)) next.delete(session.id);
      else next.add(session.id);
      return next;
    });
  }

  function cancelSelection() {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }

  async function deleteSelected() {
    const removed = await onDelete(selected);
    if (removed) cancelSelection();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
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
              <Text style={styles.eyebrow}>FOCUS ARCHIVE</Text>
              <Text style={styles.title}>计时记录</Text>
            </View>
            <View style={styles.headerActions}>
              {sessions.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (isSelecting) cancelSelection();
                    else setIsSelecting(true);
                  }}
                  style={styles.eraseButton}
                >
                  <Text
                    style={[
                      styles.eraseText,
                      isSelecting && styles.eraseTextActive,
                    ]}
                  >
                    {isSelecting ? 'cancel' : 'delete'}
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

          <View style={styles.filters}>
            {[
              ['all', '全部'],
              ['countdown', '倒计时'],
              ['stopwatch', '正计时'],
            ].map(([key, label]) => (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: filter === key }}
                onPress={() => setFilter(key as Filter)}
                style={[
                  styles.filterButton,
                  filter === key && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === key && styles.filterTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {isSelecting ? (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>已选择 {selected.length} 条</Text>
              <Pressable
                accessibilityRole="button"
                disabled={selected.length === 0}
                onPress={() => void deleteSelected()}
                style={[
                  styles.deleteButton,
                  selected.length === 0 && styles.deleteButtonDisabled,
                ]}
              >
                <Text style={styles.deleteText}>delete selected</Text>
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="time-outline" size={28} color={colors.inkFaint} />
                <Text style={styles.emptyTitle}>暂无计时记录</Text>
              </View>
            ) : (
              filtered.map((session) => {
                const checked = selectedIds.has(session.id);
                const isCountdown = session.mode === 'countdown';

                return (
                  <Pressable
                    key={session.id}
                    disabled={!isSelecting}
                    accessibilityRole={isSelecting ? 'checkbox' : undefined}
                    accessibilityState={
                      isSelecting ? { checked } : undefined
                    }
                    onPress={() => toggleSelected(session)}
                    style={[
                      styles.record,
                      checked && styles.recordSelected,
                    ]}
                  >
                    {isSelecting ? (
                      <View
                        style={[
                          styles.checkbox,
                          checked && styles.checkboxActive,
                        ]}
                      >
                        {checked ? (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={colors.white}
                          />
                        ) : null}
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.modeIcon,
                          {
                            backgroundColor: isCountdown
                              ? colors.accentSoft
                              : colors.longTermSoft,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            isCountdown ? 'hourglass-outline' : 'infinite-outline'
                          }
                          size={17}
                          color={
                            isCountdown ? colors.accent : colors.longTerm
                          }
                        />
                      </View>
                    )}
                    <View style={styles.recordCopy}>
                      <Text style={styles.recordTitle}>{session.note}</Text>
                      <Text style={styles.recordMeta}>
                        {isCountdown ? '倒计时' : '正计时'} ·{' '}
                        {formatDate(session.endedAt)}
                      </Text>
                    </View>
                    <Text style={styles.duration}>
                      {formatDuration(session.elapsedSeconds)}
                    </Text>
                  </Pressable>
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
  root: {
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
  headerActions: {
    flexDirection: 'row',
    gap: 7,
  },
  eraseButton: {
    minWidth: 52,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
  },
  filters: {
    marginTop: 17,
    padding: 4,
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
  },
  filterButton: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  filterButtonActive: {
    backgroundColor: colors.surface,
  },
  filterText: {
    color: colors.inkFaint,
    fontSize: 10,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.ink,
  },
  selectionBar: {
    minHeight: 46,
    marginTop: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.sm,
    backgroundColor: '#F1E5DB',
  },
  selectionText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  deleteButton: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.danger,
  },
  deleteButtonDisabled: {
    opacity: 0.35,
  },
  deleteText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  list: {
    flexGrow: 0,
    maxHeight: 430,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  empty: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: colors.inkFaint,
    fontSize: 11,
  },
  record: {
    minHeight: 70,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  recordSelected: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  checkboxActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  modeIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  recordCopy: {
    flex: 1,
  },
  recordTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  recordMeta: {
    marginTop: 4,
    color: colors.inkFaint,
    fontSize: 9,
  },
  duration: {
    color: colors.inkSoft,
    fontSize: 10,
    fontWeight: '700',
  },
});
