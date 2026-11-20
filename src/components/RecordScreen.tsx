import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useFocusSessions } from '../hooks/useFocusSessions';
import { colors, radii, shadows } from '../theme';
import type { FocusSession, TimerMode } from '../types';

type TimerStatus = 'idle' | 'running' | 'paused';

const DURATION_PRESETS = [15, 25, 45, 60];

function formatTimer(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(restSeconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(
    2,
    '0',
  )}`;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds} 秒`;
  if (seconds === 0) return `${minutes} 分钟`;
  return `${minutes} 分 ${seconds} 秒`;
}

function formatRecordTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function SessionRow({ session }: { session: FocusSession }) {
  const isCountdown = session.mode === 'countdown';

  return (
    <View style={styles.sessionRow}>
      <View
        style={[
          styles.sessionIcon,
          {
            backgroundColor: isCountdown
              ? colors.accentSoft
              : colors.longTermSoft,
          },
        ]}
      >
        <Ionicons
          name={isCountdown ? 'hourglass-outline' : 'infinite-outline'}
          size={18}
          color={isCountdown ? colors.accent : colors.longTerm}
        />
      </View>
      <View style={styles.sessionCopy}>
        <Text style={styles.sessionTitle}>{session.note}</Text>
        <Text style={styles.sessionMeta}>
          {isCountdown ? '倒计时' : '正计时'} · {formatRecordTime(session.endedAt)}
        </Text>
      </View>
      <Text style={styles.sessionDuration}>
        {formatDuration(session.elapsedSeconds)}
      </Text>
    </View>
  );
}

export function RecordScreen({ userId }: { userId?: string }) {
  const focusState = useFocusSessions(userId);
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [durationMinutes, setDurationMinutes] = useState('25');
  const [note, setNote] = useState('专注学习');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [baseElapsedMs, setBaseElapsedMs] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const completionHandled = useRef(false);

  const durationSeconds = Math.max(
    60,
    Math.min(36000, Number(durationMinutes || 0) * 60),
  );
  const activeElapsedMs =
    baseElapsedMs +
    (runStartedAt === null ? 0 : Math.max(0, nowMs - runStartedAt));
  const elapsedSeconds = Math.floor(activeElapsedMs / 1000);
  const remainingSeconds =
    mode === 'countdown'
      ? Math.max(0, durationSeconds - elapsedSeconds)
      : elapsedSeconds;
  const displaySeconds =
    mode === 'countdown' ? remainingSeconds : elapsedSeconds;
  const todaySessions = focusState.sessions.filter((session) =>
    isToday(session.endedAt),
  );
  const todaySeconds = todaySessions.reduce(
    (total, session) => total + session.elapsedSeconds,
    0,
  );

  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (
      mode !== 'countdown' ||
      status !== 'running' ||
      remainingSeconds > 0 ||
      completionHandled.current
    ) {
      return;
    }

    completionHandled.current = true;
    void finishSession(true);
  }, [mode, remainingSeconds, status]);

  function resetTimer(nextMode = mode) {
    setMode(nextMode);
    setStatus('idle');
    setBaseElapsedMs(0);
    setRunStartedAt(null);
    setSessionStartedAt(null);
    setNowMs(Date.now());
    completionHandled.current = false;
  }

  function switchMode(nextMode: TimerMode) {
    if (nextMode === mode) return;

    if (status !== 'idle') {
      Alert.alert('正在计时', '请先完成或重置当前计时，再切换计时方式。');
      return;
    }

    resetTimer(nextMode);
  }

  function startOrResume() {
    const nextNow = Date.now();

    if (status === 'idle') {
      setSessionStartedAt(new Date(nextNow).toISOString());
    }

    setNowMs(nextNow);
    setRunStartedAt(nextNow);
    setStatus('running');
    completionHandled.current = false;
  }

  function pauseTimer() {
    const pausedElapsedMs =
      baseElapsedMs +
      (runStartedAt === null ? 0 : Math.max(0, Date.now() - runStartedAt));
    setBaseElapsedMs(pausedElapsedMs);
    setRunStartedAt(null);
    setNowMs(Date.now());
    setStatus('paused');
  }

  async function finishSession(finishedNaturally = false) {
    const currentElapsedSeconds =
      mode === 'countdown' && finishedNaturally
        ? durationSeconds
        : Math.max(0, elapsedSeconds);

    if (!finishedNaturally && currentElapsedSeconds < 1) {
      Alert.alert('还没有计时', '请先开始计时，再保存记录。');
      return;
    }

    const endedAt = new Date().toISOString();
    const startedAt =
      sessionStartedAt ??
      new Date(Date.now() - currentElapsedSeconds * 1000).toISOString();
    setIsSaving(true);
    setStatus('idle');
    setRunStartedAt(null);

    const saved = await focusState.addSession({
      mode,
      note: note.trim() || (mode === 'countdown' ? '倒计时学习' : '专注计时'),
      plannedSeconds: mode === 'countdown' ? durationSeconds : 0,
      elapsedSeconds: currentElapsedSeconds,
      startedAt,
      endedAt,
    });
    setIsSaving(false);

    if (saved) {
      setBaseElapsedMs(0);
      setSessionStartedAt(null);
      setNowMs(Date.now());
      completionHandled.current = false;
      Alert.alert(
        mode === 'countdown' && finishedNaturally
          ? '倒计时完成'
          : '记录已保存',
        `本次专注 ${formatDuration(currentElapsedSeconds)}`,
      );
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>FOCUS LOG</Text>
        <Text style={styles.title}>把专注留成记录。</Text>
        <Text style={styles.subtitle}>
          设置一个期限，或者只是开始。时间会替你留下答案。
        </Text>
      </View>

      <LinearGradient
        colors={['#263B31', '#3B6553']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.timerCard}
      >
        <View style={styles.modeSwitch}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'countdown' }}
            onPress={() => switchMode('countdown')}
            style={[
              styles.modeButton,
              mode === 'countdown' && styles.modeButtonActive,
            ]}
          >
            <Ionicons
              name="hourglass-outline"
              size={15}
              color={mode === 'countdown' ? colors.ink : '#C8D9D1'}
            />
            <Text
              style={[
                styles.modeText,
                mode === 'countdown' && styles.modeTextActive,
              ]}
            >
              倒计时
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'stopwatch' }}
            onPress={() => switchMode('stopwatch')}
            style={[
              styles.modeButton,
              mode === 'stopwatch' && styles.modeButtonActive,
            ]}
          >
            <Ionicons
              name="infinite-outline"
              size={15}
              color={mode === 'stopwatch' ? colors.ink : '#C8D9D1'}
            />
            <Text
              style={[
                styles.modeText,
                mode === 'stopwatch' && styles.modeTextActive,
              ]}
            >
              正计时
            </Text>
          </Pressable>
        </View>

        <View style={styles.timerFace}>
          <View style={styles.timerRing}>
            <Text style={styles.timerDisplay}>{formatTimer(displaySeconds)}</Text>
            <Text style={styles.timerState}>
              {status === 'running'
                ? '专注进行中'
                : status === 'paused'
                  ? '已暂停'
                  : mode === 'countdown'
                    ? `计划 ${durationMinutes || 0} 分钟`
                    : '准备好时开始'}
            </Text>
          </View>
          <View style={styles.timerAccent} />
        </View>

        <View style={styles.timerActions}>
          {status === 'running' ? (
            <Pressable
              accessibilityRole="button"
              onPress={pauseTimer}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="pause" size={19} color={colors.ink} />
              <Text style={styles.primaryButtonText}>暂停</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={startOrResume}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name={status === 'paused' ? 'play' : 'play-outline'}
                size={19}
                color={colors.ink}
              />
              <Text style={styles.primaryButtonText}>
                {status === 'paused' ? '继续' : '开始'}
              </Text>
            </Pressable>
          )}

          {status !== 'idle' ? (
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void finishSession(false)}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="checkmark" size={18} color={colors.white} />
              )}
              <Text style={styles.secondaryButtonText}>完成并记录</Text>
            </Pressable>
          ) : null}

          {status !== 'idle' || baseElapsedMs > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="重置计时"
              onPress={() => resetTimer()}
              style={styles.resetButton}
            >
              <Ionicons name="refresh" size={18} color="#D8E5DF" />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.setupCard}>
        <View style={styles.setupHeader}>
          <View>
            <Text style={styles.setupTitle}>这次在专注什么？</Text>
            <Text style={styles.setupHint}>给这段记录加一个名字</Text>
          </View>
          <Ionicons name="create-outline" size={20} color={colors.inkFaint} />
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="例如：阅读第二章"
          placeholderTextColor={colors.inkFaint}
          maxLength={60}
          style={styles.noteInput}
        />

        {mode === 'countdown' ? (
          <>
            <Text style={styles.durationLabel}>倒计时长度</Text>
            <View style={styles.presetRow}>
              {DURATION_PRESETS.map((minutes) => {
                const selected = Number(durationMinutes) === minutes;

                return (
                  <Pressable
                    key={minutes}
                    accessibilityRole="button"
                    disabled={status !== 'idle'}
                    onPress={() => setDurationMinutes(String(minutes))}
                    style={[
                      styles.presetButton,
                      selected && styles.presetButtonActive,
                      status !== 'idle' && styles.presetButtonDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selected && styles.presetTextActive,
                      ]}
                    >
                      {minutes} 分钟
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.customDuration}>
              <Text style={styles.customLabel}>自定义</Text>
              <TextInput
                value={durationMinutes}
                onChangeText={(value) =>
                  setDurationMinutes(value.replace(/[^\d]/g, ''))
                }
                editable={status === 'idle'}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
                style={styles.durationInput}
              />
              <Text style={styles.customLabel}>分钟</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.todaySummary}>
        <View style={styles.summaryIcon}>
          <Ionicons name="sparkles-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>今天已经专注</Text>
          <Text style={styles.summaryValue}>
            {formatDuration(todaySeconds)}
          </Text>
        </View>
        <Text style={styles.summaryCount}>{todaySessions.length} 段记录</Text>
      </View>

      {focusState.error ? (
        <View style={styles.errorBanner}>
          <Ionicons
            name="cloud-offline-outline"
            size={17}
            color={colors.danger}
          />
          <Text style={styles.errorText}>{focusState.error}</Text>
          <Pressable onPress={focusState.clearError} hitSlop={8}>
            <Ionicons name="close" size={17} color={colors.danger} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.historyHeader}>
        <View>
          <Text style={styles.historyTitle}>计时记录</Text>
          <Text style={styles.historyHint}>每一次开始都值得留下</Text>
        </View>
        <Text style={styles.historyCount}>
          {focusState.sessions.length} 条
        </Text>
      </View>

      {focusState.isLoading ? (
        <View style={styles.historyLoading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : focusState.sessions.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Ionicons name="time-outline" size={28} color={colors.inkFaint} />
          <Text style={styles.emptyHistoryTitle}>还没有计时记录</Text>
          <Text style={styles.emptyHistoryHint}>
            完成第一次专注后，记录会出现在这里。
          </Text>
        </View>
      ) : (
        <View style={styles.sessionList}>
          {focusState.sessions.slice(0, 20).map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  intro: {
    marginBottom: 22,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    marginTop: 9,
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 330,
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 20,
  },
  timerCard: {
    padding: 18,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  modeSwitch: {
    padding: 4,
    flexDirection: 'row',
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modeButton: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
  },
  modeButtonActive: {
    backgroundColor: '#F1EEE5',
  },
  modeText: {
    color: '#C8D9D1',
    fontSize: 12,
    fontWeight: '700',
  },
  modeTextActive: {
    color: colors.ink,
  },
  timerFace: {
    minHeight: 235,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRing: {
    width: 214,
    height: 214,
    borderRadius: 107,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  timerDisplay: {
    color: colors.white,
    fontSize: 51,
    lineHeight: 58,
    fontWeight: '300',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerState: {
    marginTop: 5,
    color: '#BDD1C8',
    fontSize: 11,
  },
  timerAccent: {
    position: 'absolute',
    top: 16,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  timerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  primaryButton: {
    height: 52,
    minWidth: 104,
    paddingHorizontal: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 17,
    backgroundColor: '#F3EEE2',
  },
  primaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 17,
    backgroundColor: colors.accent,
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  resetButton: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  buttonPressed: {
    opacity: 0.76,
  },
  setupCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  setupTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  setupHint: {
    marginTop: 3,
    color: colors.inkFaint,
    fontSize: 10,
  },
  noteInput: {
    height: 47,
    marginTop: 12,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  durationLabel: {
    marginTop: 16,
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  presetRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 7,
  },
  presetButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
  },
  presetButtonActive: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  presetButtonDisabled: {
    opacity: 0.45,
  },
  presetText: {
    color: colors.inkSoft,
    fontSize: 10,
    fontWeight: '700',
  },
  presetTextActive: {
    color: colors.accent,
  },
  customDuration: {
    height: 42,
    marginTop: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  customLabel: {
    color: colors.inkSoft,
    fontSize: 11,
  },
  durationInput: {
    flex: 1,
    height: 38,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  todaySummary: {
    minHeight: 82,
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  summaryCopy: {
    flex: 1,
  },
  summaryTitle: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  summaryValue: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryCount: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  errorBanner: {
    marginTop: 12,
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
  historyHeader: {
    marginTop: 25,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  historyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  historyHint: {
    marginTop: 3,
    color: colors.inkFaint,
    fontSize: 10,
  },
  historyCount: {
    color: colors.inkSoft,
    fontSize: 10,
    fontWeight: '700',
  },
  historyLoading: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistory: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  emptyHistoryTitle: {
    marginTop: 9,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyHistoryHint: {
    marginTop: 4,
    color: colors.inkFaint,
    fontSize: 10,
  },
  sessionList: {
    gap: 9,
  },
  sessionRow: {
    minHeight: 72,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCopy: {
    flex: 1,
  },
  sessionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  sessionMeta: {
    marginTop: 4,
    color: colors.inkFaint,
    fontSize: 9,
  },
  sessionDuration: {
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
});
