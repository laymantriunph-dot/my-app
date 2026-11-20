import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
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
import type { TaskState } from '../hooks/useTasks';
import type { AuthUser } from '../lib/supabase';
import {
  CATEGORY_META,
  getDisplayName,
  getGreeting,
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
} from '../types';
import { ArchiveModal } from './ArchiveModal';
import { RecordScreen } from './RecordScreen';
import { TaskComposer } from './TaskComposer';
import { TaskItem } from './TaskItem';

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
  const [activeSection, setActiveSection] = useState<MainSection>('energy');
  const [activeCategory, setActiveCategory] =
    useState<TaskCategory>('today');
  const [composerVisible, setComposerVisible] = useState(false);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const stats = getTaskStats(
    taskState.tasks.filter((task) => task.category === 'today'),
  );
  const visibleTasks = useMemo(
    () =>
      sortTasks(
        taskState.tasks.filter((task) => task.category === activeCategory),
      ),
    [activeCategory, taskState.tasks],
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
            title: '继续清单',
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
    (task) => !task.isCompleted,
  ).length;

  function confirmDelete(task: Task) {
    Alert.alert('删除待办？', task.title, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => void taskState.removeTask(task),
      },
    ]);
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

  async function saveCurrentTasks() {
    if (visibleTasks.length === 0) {
      Alert.alert('当前清单为空', '先添加一两条待办，再保存为历史快照。');
      return;
    }

    const saved = await archiveState.saveArchive(
      activeCategory,
      visibleTasks,
    );

    if (saved) {
      Alert.alert('已保存', '这份清单已存入历史，当前待办不会改变。');
    }
  }

  const listHeader = (
    <View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setArchiveVisible(true)}
        style={({ pressed }) => [
          styles.successButton,
          pressed && styles.toolPressed,
        ]}
      >
        <View style={styles.successIcon}>
          <Ionicons name="trophy-outline" size={18} color="#F7E5BC" />
        </View>
        <View style={styles.successCopy}>
          <Text style={styles.successTitle}>The Way Of Success</Text>
          <Text style={styles.successHint}>
            查看保存过的清单与当天分类记录
          </Text>
        </View>
        <View style={styles.successCount}>
          <Text style={styles.successCountText}>
            {archiveState.archives.length}
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#D9C590" />
        </View>
      </Pressable>

      <View style={styles.greetingBlock}>
        <Text style={styles.dateLabel}>{getTodayLabel()}</Text>
        <Text style={styles.greeting}>{getGreeting()}，{displayName}</Text>
        <Text style={styles.greetingHint}>
          {stats.remaining === 0 && stats.total > 0
            ? '今天的清单已经全部完成。'
            : `还有 ${stats.remaining} 件事，慢慢来，先做最重要的一件。`}
        </Text>
      </View>

      <LinearGradient
        colors={['#24372E', '#395B4B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.progressCard}
      >
        <View style={styles.progressCopy}>
          <Text style={styles.progressEyebrow}>TODAY'S PROGRESS</Text>
          <View style={styles.progressNumberRow}>
            <Text style={styles.progressNumber}>{stats.percentage}</Text>
            <Text style={styles.progressUnit}>%</Text>
          </View>
          <Text style={styles.progressCaption}>
            已完成 {stats.completed} / {stats.total || 0} 项
          </Text>
        </View>
        <View style={styles.progressVisual}>
          <View style={styles.progressRingOuter}>
            <View style={styles.progressRingInner}>
              <Ionicons
                name={stats.percentage === 100 ? 'checkmark' : 'sparkles-outline'}
                size={28}
                color={stats.percentage === 100 ? '#BFE8D5' : colors.white}
              />
            </View>
          </View>
          <View
            style={[
              styles.progressOrb,
              { opacity: 0.25 + stats.percentage / 100 / 2 },
            ]}
          />
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${stats.percentage}%` }]}
          />
        </View>
      </LinearGradient>

      <View style={styles.categoryCards}>
        {ACTIVE_TASK_CATEGORIES.map((key) => {
          const meta = CATEGORY_META[key];
          const categoryTasks = taskState.tasks.filter(
            (task) => task.category === key,
          );
          const categoryStats = getTaskStats(categoryTasks);
          const isActive = activeCategory === key;

          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
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
                pressed && styles.categoryCardPressed,
              ]}
            >
              <View style={styles.categoryTop}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: meta.softColor },
                  ]}
                >
                  <Ionicons name={meta.icon} size={17} color={meta.color} />
                </View>
                <Text style={[styles.categoryName, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
              <Text style={styles.categoryCount}>
                {categoryStats.remaining} 项待办
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.todoTools}>
        <Pressable
          accessibilityRole="button"
          disabled={visibleTasks.length === 0}
          onPress={() => void saveCurrentTasks()}
          style={({ pressed }) => [
            styles.saveListButton,
            visibleTasks.length === 0 && styles.toolDisabled,
            pressed && styles.toolPressed,
          ]}
        >
          <Ionicons name="archive-outline" size={17} color={colors.ink} />
          <Text style={styles.saveListText}>保存当前清单</Text>
          <Text style={styles.saveListCount}>{visibleTasks.length} 项</Text>
        </Pressable>
        <View style={styles.activeCategoryPill}>
          <Text style={styles.activeCategoryPillText}>
            {activeMeta.label}
          </Text>
        </View>
      </View>

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
            {activeCategory === 'today' ? '今天，先做主要的' : '继续积累'}
          </Text>
          <Text style={styles.listDescription}>{activeMeta.hint}</Text>
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
                    onToggle={() => void taskState.toggleTask(item)}
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
                          : '暂时没有继续事项'}
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
                        正在整理今天的蓄能清单…
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
                                onToggle={() => void taskState.toggleTask(task)}
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
              onPress={() => setComposerVisible(true)}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
            >
              <Ionicons name="add" size={26} color={colors.white} />
              <Text style={styles.addButtonText}>添加待办</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.page,
              activeSection !== 'records' && styles.hiddenPage,
            ]}
          >
            <RecordScreen userId={user?.id} />
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
              蓄能
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
              记录
            </Text>
          </Pressable>
        </View>
      </View>

      <TaskComposer
        visible={composerVisible}
        initialCategory={activeCategory}
        isSubmitting={taskState.isMutating}
        onClose={() => setComposerVisible(false)}
        onSubmit={taskState.addTask}
      />

      <ArchiveModal
        visible={archiveVisible}
        category={activeCategory}
        currentTasks={visibleTasks}
        archives={archiveState.archives}
        isLoading={archiveState.isLoading}
        error={archiveState.error}
        onClose={() => setArchiveVisible(false)}
        onSave={archiveState.saveArchive}
        onDelete={archiveState.removeArchive}
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
    backgroundColor: colors.ink,
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
    marginBottom: 21,
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
  greetingHint: {
    marginTop: 7,
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 20,
  },
  progressCard: {
    minHeight: 168,
    padding: 21,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  progressCopy: {
    zIndex: 2,
  },
  progressEyebrow: {
    color: '#B9CEC4',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
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
    color: '#C9DCD3',
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
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  categoryCards: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },
  categoryCard: {
    flex: 1,
    minHeight: 78,
    padding: 12,
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: 1,
  },
  categoryCardPressed: {
    opacity: 0.7,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoryCount: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  categoryCountMuted: {
    color: colors.inkFaint,
    fontSize: 10,
    fontWeight: '500',
  },
  todoTools: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
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
  successButton: {
    minHeight: 65,
    marginTop: 15,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: radii.md,
    backgroundColor: '#4B4938',
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
    color: '#FFF7E8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  successHint: {
    marginTop: 3,
    color: '#C8C1AB',
    fontSize: 9,
  },
  successCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  successCountText: {
    color: '#F7E5BC',
    fontSize: 15,
    fontWeight: '800',
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
    backgroundColor: 'rgba(255,252,246,0.45)',
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
    backgroundColor: '#FCF8F0',
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
    borderColor: '#FCF8F0',
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
