import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { TaskState } from '../hooks/useTasks';
import type { AuthUser } from '../lib/supabase';
import {
  CATEGORY_META,
  getDisplayName,
  getGreeting,
  getTaskStats,
  getTodayLabel,
  sortTasks,
} from '../taskUtils';
import { colors, radii, shadows } from '../theme';
import {
  TASK_CATEGORIES,
  type Task,
  type TaskCategory,
} from '../types';
import { TaskComposer } from './TaskComposer';
import { TaskItem } from './TaskItem';

type HomeScreenProps = {
  user: AuthUser | null;
  isLocal: boolean;
  taskState: TaskState;
  onSignOut: () => void;
};

export function HomeScreen({
  user,
  isLocal,
  taskState,
  onSignOut,
}: HomeScreenProps) {
  const [activeCategory, setActiveCategory] =
    useState<TaskCategory>('today');
  const [composerVisible, setComposerVisible] = useState(false);
  const stats = getTaskStats(taskState.tasks);
  const visibleTasks = useMemo(
    () =>
      sortTasks(
        taskState.tasks.filter((task) => task.category === activeCategory),
      ),
    [activeCategory, taskState.tasks],
  );
  const activeMeta = CATEGORY_META[activeCategory];
  const displayName = getDisplayName(user?.email);
  const avatarLetter = (displayName[0] ?? '我').toUpperCase();

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

  const listHeader = (
    <View>
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
              { backgroundColor: isLocal ? colors.secondary : colors.success },
            ]}
          />
        </Pressable>
      </View>

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
        {TASK_CATEGORIES.map((key) => {
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
              onPress={() => setActiveCategory(key)}
              style={({ pressed }) => [
                styles.categoryCard,
                {
                  backgroundColor: isActive ? meta.softColor : colors.surface,
                  borderColor: isActive ? meta.color : colors.line,
                },
                pressed && styles.categoryCardPressed,
              ]}
            >
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
              <Text style={styles.categoryCount}>
                {categoryStats.remaining}
                <Text style={styles.categoryCountMuted}> 待办</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>

      {taskState.error ? (
        <View style={styles.errorBanner}>
          <Ionicons
            name="cloud-offline-outline"
            size={18}
            color={colors.danger}
          />
          <Text style={styles.errorBannerText}>{taskState.error}</Text>
          <Pressable onPress={taskState.clearError} hitSlop={10}>
            <Ionicons name="close" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.listHeading}>
        <View>
          <Text style={styles.listTitle}>{activeMeta.label}清单</Text>
          <Text style={styles.listDescription}>{activeMeta.hint}</Text>
        </View>
        <Text style={styles.listCount}>{visibleTasks.length} 项</Text>
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
      <View style={styles.listFrame}>
        <FlatList
          data={taskState.isLoading ? [] : visibleTasks}
          keyExtractor={(task) => task.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              disabled={taskState.isMutating}
              onToggle={() => void taskState.toggleTask(item)}
              onDelete={() => confirmDelete(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
                    name={activeMeta.icon}
                    size={28}
                    color={activeMeta.color}
                  />
                </View>
                <Text style={styles.emptyTitle}>这一栏还是空的</Text>
                <Text style={styles.emptyDescription}>
                  写下一件具体、能开始行动的事。
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            <Text style={styles.footerText}>
              {isLocal ? '本地数据仅保存在当前设备' : '任务已通过加密连接同步'}
            </Text>
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

      <TaskComposer
        visible={composerVisible}
        initialCategory={activeCategory}
        isSubmitting={taskState.isMutating}
        onClose={() => setComposerVisible(false)}
        onSubmit={taskState.addTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  listFrame: {
    flex: 1,
    marginHorizontal: 20,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 128,
  },
  topBar: {
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
    minHeight: 108,
    padding: 11,
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
  categoryName: {
    marginTop: 10,
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
  separator: {
    height: 9,
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
});
