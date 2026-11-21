import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useArchives } from '../hooks/useArchives';
import { useFocusSessions } from '../hooks/useFocusSessions';
import { useLongTermCategoryDefaults } from '../hooks/useLongTermCategoryDefaults';
import { useMotivation } from '../hooks/useMotivation';
import { useTaskComposerPreference } from '../hooks/useTaskComposerPreference';
import { getCompletionMessage } from '../completionMessages';
import type { TaskState } from '../hooks/useTasks';
import type { AuthUser } from '../lib/supabase';
import {
  CATEGORY_META,
  getDisplayName,
  getLocalDateKey,
  getTaskStats,
  getTodayLabel,
  PRIORITY_META,
  sortTasks,
} from '../taskUtils';
import { colors, radii, shadows } from '../theme';
import {
  ACTIVE_TASK_CATEGORIES,
  type Task,
  type TaskCategory,
  type TaskPriority,
} from '../types';
import { ArchiveModal } from './ArchiveModal';
import { CategoryDefaultsModal } from './CategoryDefaultsModal';
import { CompletionToast } from './CompletionToast';
import { ConfirmDialog } from './ConfirmDialog';
import { DayPreviewModal } from './DayPreviewModal';
import { FocusHistoryModal } from './FocusHistoryModal';
import { MotivationModal } from './MotivationModal';
import { PlannerModal } from './PlannerModal';
import { ProgressDial } from './ProgressDial';
import { RecordScreen } from './RecordScreen';
import { TaskComposer } from './TaskComposer';
import { TaskItem } from './TaskItem';
import { LongTermTaskEditor } from './LongTermTaskEditor';

type HomeScreenProps = {
  user: AuthUser | null;
  isLocal: boolean;
  taskState: TaskState;
  onSignOut: () => void;
};

type MainSection = 'energy' | 'records';
type TaskSection = {
  key: string;
  title: string;
  hint: string;
  color: string;
  softColor: string;
  data: Task[];
};

export function HomeScreen({
  user,
  isLocal,
  taskState,
  onSignOut,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const archiveState = useArchives(user?.id);
  const focusState = useFocusSessions(user?.id);
  const motivationState = useMotivation(user?.id);
  const composerPreference = useTaskComposerPreference(user?.id, 'today');
  const longTermCategoryDefaults = useLongTermCategoryDefaults(user?.id);
  const [activeSection, setActiveSection] = useState<MainSection>('energy');
  const [activeCategory, setActiveCategory] =
    useState<TaskCategory>('today');
  const [composerVisible, setComposerVisible] = useState(false);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [focusHistoryVisible, setFocusHistoryVisible] = useState(false);
  const [motivationVisible, setMotivationVisible] = useState(false);
  const [plannerVisible, setPlannerVisible] = useState(false);
  const [dayPreviewVisible, setDayPreviewVisible] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Task | null>(null);
  const [editingLongTermTask, setEditingLongTermTask] = useState<Task | null>(
    null,
  );
  const [categoryDefaultsVisible, setCategoryDefaultsVisible] =
    useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [todayKey, setTodayKey] = useState(getLocalDateKey());
  const [planningDate, setPlanningDate] = useState(todayKey);
  const [composerDate, setComposerDate] = useState(todayKey);
  const [composerCategory, setComposerCategory] = useState<TaskCategory>(
    composerPreference.preferredCategory,
  );
  const [longTermCategoryFilter, setLongTermCategoryFilter] = useState<
    string | null
  >(null);
  const [completionToast, setCompletionToast] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const todayTasks = taskState.tasks.filter(
    (task) =>
      task.category === 'today' &&
      task.scheduledDate <= todayKey &&
      (!task.isCompleted ||
        (task.completedAt && getLocalDateKey(task.completedAt) === todayKey)),
  );
  const stats = getTaskStats(todayTasks);
  const longTermCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          taskState.tasks
            .filter(
              (task) =>
                task.category === 'longTerm' &&
                !task.isCompleted &&
                task.customCategory,
            )
            .map((task) => task.customCategory as string),
        ),
      ).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    [taskState.tasks],
  );
  const visibleTasks = useMemo(
    () =>
      sortTasks(
        taskState.tasks.filter((task) => {
          if (task.category !== activeCategory) return false;
          if (activeCategory === 'today') {
            if (task.scheduledDate > todayKey) return false;
            return (
              !task.isCompleted ||
              Boolean(
                task.completedAt &&
                  getLocalDateKey(task.completedAt) === todayKey,
              )
            );
          }
          // 遐筹是长期提醒，不受安排日期限制。
          if (
            longTermCategoryFilter &&
            task.customCategory !== longTermCategoryFilter
          ) {
            return false;
          }
          return !task.isCompleted;
        }),
      ),
    [
      activeCategory,
      longTermCategoryFilter,
      taskState.tasks,
      todayKey,
    ],
  );
  const pendingTasks = visibleTasks.filter((task) => !task.isCompleted);
  const completedTasks = visibleTasks.filter((task) => task.isCompleted);
  const taskSections: TaskSection[] =
    activeCategory === 'today'
      ? [
          {
            key: 'primary',
            title: PRIORITY_META.primary.label,
            hint: PRIORITY_META.primary.hint,
            color: PRIORITY_META.primary.color,
            softColor: PRIORITY_META.primary.softColor,
            data: pendingTasks.filter(
              (task) => task.priority === 'primary',
            ),
          },
          {
            key: 'secondary',
            title: PRIORITY_META.secondary.label,
            hint: PRIORITY_META.secondary.hint,
            color: PRIORITY_META.secondary.color,
            softColor: PRIORITY_META.secondary.softColor,
            data: pendingTasks.filter(
              (task) => task.priority === 'secondary',
            ),
          },
        ]
      : [
          {
            key: 'continue',
            title: '遐筹清单',
            hint: CATEGORY_META.longTerm.hint,
            color: CATEGORY_META.longTerm.color,
            softColor: CATEGORY_META.longTerm.softColor,
            data: pendingTasks,
          },
        ];
  const activeMeta = CATEGORY_META[activeCategory];
  const displayName = getDisplayName(user?.email);
  const avatarLetter = (displayName[0] ?? '我').toUpperCase();
  const allPendingCount = taskState.tasks.filter(
    (task) => !task.isCompleted && task.scheduledDate <= todayKey,
  ).length;
  const futurePlannedCount = taskState.tasks.filter(
    (task) =>
      task.category === 'today' &&
      !task.isCompleted &&
      task.scheduledDate > todayKey,
  ).length;

  function confirmDelete(task: Task) {
    setDeleteCandidate(task);
  }

  async function deleteTask(task: Task) {
    setDeleteCandidate(null);
    await taskState.removeTask(task);
  }

  function openComposer(
    date = todayKey,
    category: TaskCategory = activeCategory,
  ) {
    setComposerDate(date);
    setComposerCategory(category);
    setComposerVisible(true);
  }

  async function addTask(
    title: string,
    category: TaskCategory,
    priority: TaskPriority,
    scheduledDate: string,
    customCategory: string | null,
  ) {
    const saved = await taskState.addTask(
      title,
      category,
      priority,
      scheduledDate,
      customCategory,
    );

    if (saved) {
      await composerPreference.setPreferredCategory(category);
      if (category === 'longTerm') {
        setLongTermCategoryFilter(null);
      }
      if (scheduledDate <= todayKey) {
        setActiveCategory(category);
        setShowCompleted(false);
      }
    }

    return saved;
  }

  function openAccountMenu() {
    if (!user) {
      Alert.alert(
        '本地模式',
        '当前任务只保存在这台手机上。配置登录服务后，可从登录页连接账号并跨设备同步。',
      );
      return;
    }

    Alert.alert(
      displayName,
      `${user.email ?? '已登录'}\n任务已同步到云端。`,
      [
        { text: '继续使用', style: 'cancel' },
        {
          text: '退出登录',
          style: 'destructive',
          onPress: onSignOut,
        },
      ],
    );
  }

  async function toggleTaskAndArchive(task: Task) {
    const wasCompleted = task.isCompleted;
    const completedAt = new Date().toISOString();
    const updated = await taskState.toggleTask(task);

    if (!updated) return;

    if (wasCompleted) {
      if (task.completedAt) {
        await archiveState.unrecordCompletedTask(task, task.completedAt);
      }
    } else {
      setCompletionToast({
        id: Date.now(),
        message: getCompletionMessage(),
      });
      await archiveState.recordCompletedTask(task, completedAt);
    }
  }

  async function deleteAccomplishedTasks(tasks: Task[]) {
    let success = true;

    for (const task of tasks) {
      if (taskState.tasks.some((item) => item.id === task.id)) {
        const removedTask = await taskState.removeTask(task);
        if (!removedTask) {
          success = false;
          continue;
        }
      }

      if (!task.completedAt) {
        success = false;
        continue;
      }
      const removed = await archiveState.unrecordCompletedTask(
        task,
        task.completedAt,
      );
      if (!removed) success = false;
    }

    return success;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTodayKey(getLocalDateKey());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const listHeader = (
    <View>
      <View style={styles.topActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setArchiveVisible(true)}
          style={({ pressed }) => [
            styles.successButton,
            pressed && styles.toolPressed,
          ]}
        >
          <View style={styles.successIcon}>
            <Ionicons name="trophy-outline" size={18} color="#F2E6CD" />
          </View>
          <View style={styles.successCopy}>
            <Text style={styles.successTitle}>Accomplished</Text>
          </View>
          <View style={styles.successCount}>
            <Text style={styles.successCountText}>
              {archiveState.archives.length}
            </Text>
            <Ionicons name="chevron-forward" size={15} color="#D9CEB6" />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setFocusHistoryVisible(true)}
          style={({ pressed }) => [
            styles.focusArchiveButton,
            pressed && styles.toolPressed,
          ]}
        >
          <View style={styles.focusArchiveIcon}>
            <Ionicons name="timer-outline" size={18} color={colors.longTerm} />
          </View>
          <View>
            <Text style={styles.focusArchiveTitle}>Focus</Text>
            <Text style={styles.focusArchiveHint}>
              {focusState.sessions.length} 条计时
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.greetingBlock}>
        <Text style={styles.dateLabel}>{getTodayLabel()}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="自定义今日寄语"
          onPress={() => setMotivationVisible(true)}
          style={styles.greetingRow}
        >
          <Text style={styles.greeting}>{motivationState.motivation}</Text>
          <View style={styles.editGreetingButton}>
            <Ionicons name="pencil-outline" size={14} color={colors.inkFaint} />
          </View>
        </Pressable>
      </View>

      <View style={styles.categoryCards}>
        {ACTIVE_TASK_CATEGORIES.map((key) => {
          const meta = CATEGORY_META[key];
          const categoryTasks = taskState.tasks.filter(
            (task) =>
              task.category === key &&
              !task.isCompleted &&
              (key === 'longTerm' || task.scheduledDate <= todayKey),
          );
          const categoryStats = getTaskStats(categoryTasks);
          const isActive = activeCategory === key;

          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityLabel={`${meta.label}，${categoryStats.remaining}项待办`}
              accessibilityState={{ selected: isActive }}
              onPress={() => {
                setActiveCategory(key);
                setShowCompleted(false);
              }}
              style={({ pressed }) => [
                styles.categoryCard,
                {
                  backgroundColor: isActive ? meta.softColor : colors.surface,
                  borderColor: isActive ? meta.color : colors.line,
                },
                isActive
                  ? styles.categoryCardActive
                  : styles.categoryCardIdle,
                pressed && styles.categoryCardPressed,
              ]}
            >
              <View style={styles.categoryTop}>
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor: isActive
                        ? meta.color
                        : meta.softColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={meta.icon}
                    size={21}
                    color={isActive ? colors.white : meta.color}
                  />
                </View>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: isActive
                        ? colors.surface
                        : meta.softColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryBadgeText,
                      { color: meta.color },
                    ]}
                  >
                    {categoryStats.remaining > 99
                      ? '99+'
                      : categoryStats.remaining}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryCopy}>
                <Text
                  style={[
                    styles.categoryName,
                    { color: isActive ? meta.color : colors.ink },
                  ]}
                >
                  {meta.label}
                </Text>
                <Text
                  style={[
                    styles.categoryEyebrow,
                    {
                      color: isActive
                        ? meta.color
                        : colors.inkFaint,
                    },
                  ]}
                >
                  {key === 'today' ? 'TODAY' : 'LONG VIEW'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {activeCategory === 'today' ? (
        <LinearGradient
          colors={['#405A4D', '#6A8376']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          <View style={styles.progressCopy}>
            <Text style={styles.progressEyebrow}>朝计 · TODAY</Text>
            <Text style={styles.progressStatement}>把今天，稳稳完成。</Text>
            <Text style={styles.progressCaption}>
              {stats.completed} accomplished · {stats.remaining} remaining
            </Text>
          </View>
          <ProgressDial percentage={stats.percentage} />
        </LinearGradient>
      ) : (
        <View style={styles.reflectionCard}>
          <View style={styles.reflectionIcon}>
            <Ionicons
              name="infinite-outline"
              size={22}
              color="#EDE3CD"
            />
          </View>
          <View style={styles.reflectionCopy}>
            <Text style={styles.reflectionEyebrow}>
              遐筹 · LONG VIEW
            </Text>
            <Text style={styles.reflectionTitle}>
              把重要的事，放在长期视野里。
            </Text>
            <Text style={styles.reflectionHint}>
              持续推进 · 不计入今日完成率
            </Text>
          </View>
        </View>
      )}

      {activeCategory === 'longTerm' &&
      longTermCategoryOptions.length > 0 ? (
        <View style={styles.longTermFilters}>
          <View style={styles.longTermFilterHeading}>
            <Text style={styles.longTermFilterTitle}>筛选遐筹</Text>
            {longTermCategoryFilter ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setLongTermCategoryFilter(null)}
                style={styles.clearFilterButton}
              >
                <Text style={styles.clearFilterText}>清除</Text>
              </Pressable>
            ) : (
              <Text style={styles.longTermFilterHint}>按分类查看</Text>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.longTermFilterRail}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: longTermCategoryFilter === null,
              }}
              onPress={() => setLongTermCategoryFilter(null)}
              style={[
                styles.filterChip,
                longTermCategoryFilter === null && styles.filterChipAllActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  longTermCategoryFilter === null &&
                    styles.filterChipTextAllActive,
                ]}
              >
                全部
              </Text>
            </Pressable>

            {longTermCategoryOptions.map((category) => {
              const isActive = longTermCategoryFilter === category;
              return (
                <Pressable
                  key={`category:${category}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() =>
                    setLongTermCategoryFilter(isActive ? null : category)
                  }
                  style={[
                    styles.filterChip,
                    styles.categoryFilterChip,
                    isActive && styles.categoryFilterChipActive,
                  ]}
                >
                  <Ionicons
                    name="folder-outline"
                    size={12}
                    color={isActive ? colors.white : colors.longTerm}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: colors.longTerm },
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {activeCategory === 'today' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="打开日历"
          onPress={() => setPlannerVisible(true)}
          style={({ pressed }) => [
            styles.calendarButton,
            pressed && styles.toolPressed,
          ]}
        >
          <View style={styles.calendarIcon}>
            <Ionicons name="calendar-outline" size={18} color={colors.ink} />
          </View>
          <View style={styles.calendarCopy}>
            <Text style={styles.calendarTitle}>Calendar</Text>
            <Text style={styles.calendarHint}>
              {futurePlannedCount > 0
                ? `${futurePlannedCount} 项未来计划`
                : '打开日历安排未来'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
        </Pressable>
      ) : null}

      {taskState.error || archiveState.error ? (
        <View style={styles.errorBanner}>
          <Ionicons
            name="cloud-offline-outline"
            size={18}
            color={colors.danger}
          />
          <Text style={styles.errorBannerText}>
            {taskState.error ?? archiveState.error}
          </Text>
          <Pressable
            onPress={() => {
              taskState.clearError();
              archiveState.clearError();
            }}
            hitSlop={10}
          >
            <Ionicons name="close" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.listHeading}>
        <View>
          <Text style={styles.listTitle}>
            {activeCategory === 'today'
              ? 'Lead the day.'
              : 'Think beyond today.'}
          </Text>
          {activeCategory === 'today' ? (
            <Text style={styles.listDescription}>
              先完成 Primary，再让其余事情各归其位。
            </Text>
          ) : null}
        </View>
        <Text style={styles.listCount}>
          {pendingTasks.length} 待办 · {completedTasks.length} 完成
        </Text>
      </View>

      {taskState.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={activeMeta.color} />
          <Text style={styles.loadingText}>正在整理清单…</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.appShell}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.miniMark}>
              <Text style={styles.miniMarkText}>三</Text>
            </View>
            <View>
              <Text style={styles.brandName}>三分待办</Text>
              <Text style={styles.syncMode}>
                {isLocal ? '仅保存在本机' : '云端同步已开启'}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="账号信息"
            onPress={openAccountMenu}
            style={({ pressed }) => [
              styles.avatar,
              pressed && styles.avatarPressed,
            ]}
          >
            <Text style={styles.avatarText}>{avatarLetter}</Text>
            <View
              style={[
                styles.accountDot,
                {
                  backgroundColor: isLocal
                    ? colors.secondary
                    : colors.success,
                },
              ]}
            />
          </Pressable>
        </View>

        <View style={styles.pages}>
          <View
            style={[
              styles.page,
              activeSection !== 'energy' && styles.hiddenPage,
            ]}
          >
            <View style={styles.listFrame}>
              <SectionList
                sections={taskState.isLoading ? [] : taskSections}
                keyExtractor={(task) => task.id}
                renderItem={({ item }) => (
                  <TaskItem
                    task={item}
                    disabled={taskState.isMutating}
                    onToggle={() => void toggleTaskAndArchive(item)}
                    onEdit={
                      item.category === 'longTerm'
                        ? () => setEditingLongTermTask(item)
                        : undefined
                    }
                    onDelete={() => confirmDelete(item)}
                  />
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.separator} />
                )}
                renderSectionHeader={({ section }) => (
                  <View style={styles.taskSectionHeader}>
                    <View style={styles.taskSectionTitleRow}>
                      <View
                        style={[
                          styles.taskSectionDot,
                          { backgroundColor: section.color },
                        ]}
                      />
                      <Text style={styles.taskSectionTitle}>
                        {section.title}
                      </Text>
                      {activeCategory === 'today' ? (
                        <View
                          style={[
                            styles.taskSectionCount,
                            { backgroundColor: section.softColor },
                          ]}
                        >
                          <Text
                            style={[
                              styles.taskSectionCountText,
                              { color: section.color },
                            ]}
                          >
                            {section.data.length}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.taskSectionHint}>{section.hint}</Text>
                  </View>
                )}
                renderSectionFooter={({ section }) =>
                  section.data.length === 0 ? (
                    <View style={styles.sectionEmpty}>
                      <Text style={styles.sectionEmptyText}>
                        {activeCategory === 'today'
                          ? `暂时没有${section.title}待办`
                          : longTermCategoryFilter
                            ? '当前筛选下没有遐筹事项'
                            : '暂时没有遐筹事项'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.sectionGap} />
                  )
                }
                ListHeaderComponent={listHeader}
                ListEmptyComponent={
                  taskState.isLoading ? undefined : (
                    <View style={styles.emptyState}>
                      <View
                        style={[
                          styles.emptyIcon,
                          { backgroundColor: activeMeta.softColor },
                        ]}
                      >
                        <Ionicons
                          name={
                            completedTasks.length > 0
                              ? 'checkmark-done-outline'
                              : activeMeta.icon
                          }
                          size={28}
                          color={activeMeta.color}
                        />
                      </View>
                      <Text style={styles.emptyTitle}>
                        正在整理今天的朝计清单…
                      </Text>
                    </View>
                  )
                }
                ListFooterComponent={
                  <View>
                    {activeCategory === 'today' ? (
                      <View style={styles.completedSection}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ expanded: showCompleted }}
                          onPress={() => setShowCompleted((current) => !current)}
                          style={({ pressed }) => [
                            styles.completedHeader,
                            pressed && styles.toolPressed,
                          ]}
                        >
                          <View style={styles.completedTitleRow}>
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={18}
                              color={colors.success}
                            />
                            <Text style={styles.completedTitle}>已完成</Text>
                          </View>
                          <View style={styles.completedAction}>
                            <Text style={styles.completedCount}>
                              {completedTasks.length} 项
                            </Text>
                            <Ionicons
                              name={
                                showCompleted ? 'chevron-up' : 'chevron-down'
                              }
                              size={16}
                              color={colors.inkFaint}
                            />
                          </View>
                        </Pressable>
                        {showCompleted && completedTasks.length > 0 ? (
                          <View style={styles.completedList}>
                            {completedTasks.map((task) => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                disabled={taskState.isMutating}
                                onToggle={() => void toggleTaskAndArchive(task)}
                                onDelete={() => confirmDelete(task)}
                              />
                            ))}
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                    <Text style={styles.footerText}>
                      {isLocal
                        ? '本地数据仅保存在当前设备'
                        : '任务已通过加密连接同步'}
                    </Text>
                  </View>
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={() => void taskState.refresh()}
                    tintColor={colors.accent}
                    colors={[colors.accent]}
                  />
                }
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="添加待办"
              onPress={() => openComposer()}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
            >
              <Ionicons name="add" size={26} color={colors.white} />
              <Text style={styles.addButtonText}>
                {activeCategory === 'longTerm' ? '添加遐筹' : '添加待办'}
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.page,
              activeSection !== 'records' && styles.hiddenPage,
            ]}
          >
            <RecordScreen focusState={focusState} userId={user?.id} />
          </View>
        </View>

        <View
          style={[
            styles.bottomNav,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === 'energy' }}
            onPress={() => setActiveSection('energy')}
            style={styles.navItem}
          >
            <View
              style={[
                styles.navIcon,
                activeSection === 'energy' && styles.navIconActive,
              ]}
            >
              <Ionicons
                name={
                  activeSection === 'energy' ? 'layers' : 'layers-outline'
                }
                size={21}
                color={
                  activeSection === 'energy' ? colors.white : colors.inkFaint
                }
              />
              {allPendingCount > 0 ? (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>
                    {allPendingCount > 99 ? '99+' : allPendingCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.navLabel,
                activeSection === 'energy' && styles.navLabelActive,
              ]}
            >
              谋篇
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === 'records' }}
            onPress={() => setActiveSection('records')}
            style={styles.navItem}
          >
            <View
              style={[
                styles.navIcon,
                activeSection === 'records' && styles.navIconActive,
              ]}
            >
              <Ionicons
                name={
                  activeSection === 'records' ? 'timer' : 'timer-outline'
                }
                size={21}
                color={
                  activeSection === 'records' ? colors.white : colors.inkFaint
                }
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                activeSection === 'records' && styles.navLabelActive,
              ]}
            >
              时笺
            </Text>
          </Pressable>
        </View>
      </View>

      <CompletionToast
        key={completionToast?.id ?? 'completion-toast'}
        message={completionToast?.message ?? null}
        onDone={() => setCompletionToast(null)}
      />

      <TaskComposer
        visible={composerVisible}
        initialCategory={composerCategory}
        initialDate={composerDate}
        isSubmitting={taskState.isMutating}
        categorySuggestions={longTermCategoryDefaults.categories}
        onClose={() => setComposerVisible(false)}
        onEditCategoryDefaults={() => setCategoryDefaultsVisible(true)}
        onCategoryChange={(category) =>
          void composerPreference.setPreferredCategory(category)
        }
        onSubmit={addTask}
      />

      <LongTermTaskEditor
        visible={editingLongTermTask !== null}
        task={editingLongTermTask}
        categorySuggestions={longTermCategoryDefaults.categories}
        isSubmitting={taskState.isMutating}
        onClose={() => setEditingLongTermTask(null)}
        onEditDefaults={() => setCategoryDefaultsVisible(true)}
        onSave={async (task, category) => {
          const saved = await taskState.updateTaskCategory(task, category);
          if (saved) {
            setLongTermCategoryFilter(null);
          }
          return saved;
        }}
      />

      <CategoryDefaultsModal
        visible={categoryDefaultsVisible}
        categories={longTermCategoryDefaults.categories}
        onClose={() => setCategoryDefaultsVisible(false)}
        onSave={longTermCategoryDefaults.setCategories}
      />

      <ArchiveModal
        visible={archiveVisible}
        archives={archiveState.archives}
        isLoading={archiveState.isLoading}
        error={archiveState.error}
        onClose={() => setArchiveVisible(false)}
        onDelete={deleteAccomplishedTasks}
      />

      <FocusHistoryModal
        visible={focusHistoryVisible}
        sessions={focusState.sessions}
        onClose={() => setFocusHistoryVisible(false)}
        onDelete={focusState.removeSessions}
      />

      <MotivationModal
        visible={motivationVisible}
        value={motivationState.motivation}
        defaultValue={motivationState.defaultMotivation}
        onClose={() => setMotivationVisible(false)}
        onSave={motivationState.setMotivation}
      />

      <PlannerModal
        visible={plannerVisible}
        selectedDate={planningDate}
        tasks={taskState.tasks}
        onClose={() => setPlannerVisible(false)}
        onSelect={(date) => {
          setPlanningDate(date);
          setDayPreviewVisible(true);
        }}
      />

      <DayPreviewModal
        visible={dayPreviewVisible}
        date={planningDate}
        tasks={taskState.tasks}
        onClose={() => setDayPreviewVisible(false)}
        onAddTask={() => {
          setDayPreviewVisible(false);
          openComposer(planningDate, 'today');
        }}
      />

      <ConfirmDialog
        visible={deleteCandidate !== null}
        title="让此任务泯迹？"
        description={
          deleteCandidate
            ? deleteCandidate.isCompleted
              ? `“${deleteCandidate.title}”会从当天清单中移除，但仍保留在 Accomplished 历史中。`
              : `“${deleteCandidate.title}”会从当前清单中移除。`
            : ''
        }
        confirmLabel="泯迹"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) void deleteTask(deleteCandidate);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  appShell: {
    flex: 1,
  },
  pages: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  hiddenPage: {
    display: 'none',
  },
  listFrame: {
    flex: 1,
    marginHorizontal: 20,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 104,
  },
  topBar: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.longTerm,
  },
  miniMarkText: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '800',
  },
  brandName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  syncMode: {
    marginTop: 2,
    color: colors.inkFaint,
    fontSize: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatarPressed: {
    opacity: 0.65,
  },
  avatarText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  accountDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  greetingBlock: {
    marginTop: 27,
    marginBottom: 17,
  },
  dateLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  greeting: {
    marginTop: 7,
    color: colors.ink,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  editGreetingButton: {
    width: 30,
    height: 30,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
  },
  progressCard: {
    minHeight: 168,
    padding: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  progressCopy: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
  },
  progressEyebrow: {
    color: '#DCE8E1',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  progressStatement: {
    marginTop: 12,
    maxWidth: 170,
    color: '#FFFDF8',
    fontFamily: 'serif',
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '600',
  },
  progressNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 7,
  },
  progressNumber: {
    color: colors.white,
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '800',
    letterSpacing: -2.5,
  },
  progressUnit: {
    marginTop: 8,
    marginLeft: 3,
    color: '#C9DCD3',
    fontSize: 17,
    fontWeight: '700',
  },
  progressCaption: {
    marginTop: 1,
    color: '#D3E1D9',
    fontSize: 12,
  },
  progressVisual: {
    position: 'absolute',
    right: 18,
    top: 20,
    width: 105,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  progressRingInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressOrb: {
    position: 'absolute',
    right: 2,
    top: 3,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.accent,
  },
  progressTrack: {
    position: 'absolute',
    left: 21,
    right: 21,
    bottom: 18,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#D8CBAE',
  },
  progressPattern: {
    position: 'absolute',
    right: 18,
    top: 20,
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPatternRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '-16deg' }],
  },
  progressPatternDot: {
    position: 'absolute',
    top: 7,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#D8CBAE',
  },
  reflectionCard: {
    minHeight: 124,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: radii.lg,
    backgroundColor: '#3A5147',
    overflow: 'hidden',
    ...shadows.card,
  },
  reflectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  reflectionCopy: {
    flex: 1,
  },
  reflectionEyebrow: {
    color: '#CFC7B4',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  reflectionTitle: {
    marginTop: 7,
    color: '#F7F3EB',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  reflectionHint: {
    marginTop: 5,
    color: '#AEBDB5',
    fontSize: 9,
  },
  categoryCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 13,
  },
  categoryCard: {
    flex: 1,
    minHeight: 104,
    padding: 14,
    justifyContent: 'space-between',
    borderRadius: radii.lg,
  },
  categoryCardActive: {
    borderWidth: 1.5,
    ...shadows.card,
  },
  categoryCardIdle: {
    borderWidth: 1,
  },
  categoryCardPressed: {
    opacity: 0.7,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    minWidth: 38,
    height: 36,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  categoryBadgeText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  categoryCopy: {
    marginTop: 11,
  },
  categoryName: {
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryEyebrow: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  longTermFilters: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  longTermFilterHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  longTermFilterTitle: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  longTermFilterHint: {
    color: colors.inkFaint,
    fontSize: 9,
  },
  clearFilterButton: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  clearFilterText: {
    color: colors.inkSoft,
    fontSize: 9,
    fontWeight: '700',
  },
  longTermFilterRail: {
    gap: 6,
    paddingRight: 2,
  },
  filterChip: {
    minHeight: 31,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterChipAllActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  categoryFilterChip: {
    backgroundColor: colors.longTermSoft,
    borderColor: '#D3E2DB',
  },
  categoryFilterChipActive: {
    backgroundColor: colors.longTerm,
    borderColor: colors.longTerm,
  },
  filterChipText: {
    color: colors.inkSoft,
    fontSize: 9,
    fontWeight: '700',
  },
  filterChipTextAllActive: {
    color: colors.white,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  calendarButton: {
    minHeight: 58,
    marginTop: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  calendarIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  calendarCopy: {
    flex: 1,
  },
  calendarTitle: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '700',
  },
  calendarHint: {
    marginTop: 3,
    color: colors.inkFaint,
    fontSize: 9,
  },
  saveListButton: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  saveListText: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  saveListCount: {
    color: colors.inkFaint,
    fontSize: 10,
  },
  historyButton: {
    minHeight: 48,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
  },
  historyButtonText: {
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  toolDisabled: {
    opacity: 0.4,
  },
  toolPressed: {
    opacity: 0.68,
  },
  topActions: {
    marginTop: 15,
    flexDirection: 'row',
    gap: 8,
  },
  successButton: {
    flex: 1,
    minHeight: 65,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: radii.md,
    backgroundColor: '#50695D',
    overflow: 'hidden',
  },
  successIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  successCopy: {
    flex: 1,
  },
  successTitle: {
    color: '#FFFBF2',
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  successHint: {
    marginTop: 3,
    color: '#D4DCD6',
    fontSize: 9,
  },
  successCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  successCountText: {
    color: '#F2E6CD',
    fontSize: 15,
    fontWeight: '800',
  },
  focusArchiveButton: {
    width: 102,
    minHeight: 65,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  focusArchiveIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.longTermSoft,
  },
  focusArchiveTitle: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '700',
  },
  focusArchiveHint: {
    marginTop: 3,
    color: colors.inkFaint,
    fontSize: 8,
  },
  activeCategoryPill: {
    minHeight: 48,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
  },
  activeCategoryPillText: {
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  errorBanner: {
    marginTop: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: radii.sm,
    backgroundColor: '#F8E4DF',
  },
  errorBannerText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
  },
  listHeading: {
    marginTop: 28,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  listTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '800',
  },
  listDescription: {
    marginTop: 3,
    color: colors.inkFaint,
    fontSize: 11,
  },
  listCount: {
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  taskSectionHeader: {
    marginTop: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  taskSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  taskSectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  taskSectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  taskSectionCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  taskSectionCountText: {
    fontSize: 9,
    fontWeight: '800',
  },
  taskSectionHint: {
    maxWidth: 190,
    color: colors.inkFaint,
    fontSize: 9,
    textAlign: 'right',
  },
  sectionEmpty: {
    minHeight: 45,
    marginBottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  sectionEmptyText: {
    color: colors.inkFaint,
    fontSize: 10,
  },
  sectionGap: {
    height: 9,
  },
  separator: {
    height: 9,
  },
  completedSection: {
    marginTop: 26,
  },
  completedHeader: {
    minHeight: 42,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  completedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  completedTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  completedCount: {
    color: colors.inkFaint,
    fontSize: 10,
  },
  completedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  completedList: {
    gap: 9,
  },
  loadingState: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.inkSoft,
    fontSize: 12,
  },
  emptyState: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: 'rgba(254,254,252,0.62)',
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 13,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyDescription: {
    marginTop: 5,
    color: colors.inkFaint,
    fontSize: 12,
    textAlign: 'center',
  },
  footerText: {
    marginTop: 22,
    color: colors.inkFaint,
    fontSize: 10,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    height: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 20,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 7,
  },
  addButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  bottomNav: {
    minHeight: 68,
    paddingTop: 9,
    paddingHorizontal: 52,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: '#FBFCF9',
  },
  navItem: {
    minWidth: 86,
    alignItems: 'center',
    gap: 4,
  },
  navIcon: {
    width: 42,
    height: 37,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: {
    backgroundColor: colors.ink,
  },
  navBadge: {
    position: 'absolute',
    right: 2,
    top: 1,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: '#FBFCF9',
  },
  navBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
  },
  navLabel: {
    color: colors.inkFaint,
    fontSize: 10,
    fontWeight: '700',
  },
  navLabelActive: {
    color: colors.ink,
  },
});
