import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AuthState, LoginProvider } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';
import { colors, radii, shadows } from '../theme';

type LoginScreenProps = {
  auth: AuthState;
  onStartLocal: () => void;
};

const providers: {
  key: LoginProvider;
  label: string;
  badge: string;
  badgeColor: string;
  badgeBackground: string;
}[] = [
  {
    key: 'qq',
    label: '使用 QQ 登录',
    badge: 'Q',
    badgeColor: colors.white,
    badgeBackground: '#21A5E8',
  },
  {
    key: 'google',
    label: '使用 Google 登录',
    badge: 'G',
    badgeColor: '#4285F4',
    badgeBackground: '#EDF3FF',
  },
  {
    key: 'outlook',
    label: '使用 Outlook 登录',
    badge: 'O',
    badgeColor: '#1769AA',
    badgeBackground: '#E3F1FB',
  },
];

export function LoginScreen({ auth, onStartLocal }: LoginScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrb} />
      <View style={styles.backgroundOrbSmall} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>三</Text>
            </View>
            <Text style={styles.brandName}>三分待办</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>A SMALLER, CLEARER LIST</Text>
            <Text style={styles.title}>把事情放回{'\n'}合适的顺序。</Text>
            <Text style={styles.subtitle}>
              今天专注、长期积累、次要事项留到有余力时。每天只看真正重要的三件事。
            </Text>
          </View>

          <LinearGradient
            colors={['#243A31', '#385C4C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCard}
          >
            <View style={styles.previewHeader}>
              <Text style={styles.previewDate}>今日 · 三分法</Text>
              <View style={styles.previewDot} />
            </View>
            <View style={styles.previewRows}>
              {[
                ['01', '当天', colors.today],
                ['02', '长期', colors.longTerm],
                ['03', '次重要', colors.secondary],
              ].map(([number, label, color]) => (
                <View key={number} style={styles.previewRow}>
                  <View
                    style={[styles.previewNumber, { backgroundColor: color }]}
                  >
                    <Text style={styles.previewNumberText}>{number}</Text>
                  </View>
                  <Text style={styles.previewLabel}>{label}</Text>
                  <View style={styles.previewLine}>
                    <View
                      style={[
                        styles.previewLineFill,
                        {
                          backgroundColor: color,
                          width:
                            number === '01'
                              ? '72%'
                              : number === '02'
                                ? '52%'
                                : '32%',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={styles.loginSection}>
            <Text style={styles.sectionTitle}>登录后跨设备保存</Text>
            <Text style={styles.sectionDescription}>
              选择你常用的账号。任务只会对你本人可见。
            </Text>

            {!isSupabaseConfigured ? (
              <View style={styles.configNotice}>
                <Ionicons
                  name="construct-outline"
                  size={18}
                  color={colors.secondary}
                />
                <Text style={styles.configNoticeText}>
                  登录服务尚未配置。你仍可先进入本地模式体验全部任务功能。
                </Text>
              </View>
            ) : null}

            {auth.error ? (
              <View style={styles.errorNotice}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.danger}
                />
                <Text style={styles.errorText}>{auth.error}</Text>
                <Pressable onPress={auth.clearError} hitSlop={10}>
                  <Ionicons name="close" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.providerList}>
              {providers.map((provider) => (
                <Pressable
                  key={provider.key}
                  accessibilityRole="button"
                  accessibilityLabel={provider.label}
                  disabled={auth.isSigningIn}
                  onPress={() => void auth.signIn(provider.key)}
                  style={({ pressed }) => [
                    styles.providerButton,
                    pressed && styles.providerButtonPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.providerBadge,
                      { backgroundColor: provider.badgeBackground },
                    ]}
                  >
                    <Text
                      style={[
                        styles.providerBadgeText,
                        { color: provider.badgeColor },
                      ]}
                    >
                      {provider.badge}
                    </Text>
                  </View>
                  <Text style={styles.providerLabel}>{provider.label}</Text>
                  {auth.isSigningIn ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={colors.inkSoft}
                    />
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onStartLocal}
              style={({ pressed }) => [
                styles.localButton,
                pressed && styles.localButtonPressed,
              ]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={colors.ink}
              />
              <Text style={styles.localButtonText}>先在本机使用</Text>
            </Pressable>
            <Text style={styles.terms}>
              登录即表示你同意仅将账号用于识别身份和同步个人待办。
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  backgroundOrb: {
    position: 'absolute',
    right: -110,
    top: 70,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E8DAC8',
    opacity: 0.55,
  },
  backgroundOrbSmall: {
    position: 'absolute',
    left: -65,
    top: 410,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.accentSoft,
    opacity: 0.7,
  },
  content: {
    paddingTop: 18,
    paddingBottom: 38,
  },
  inner: {
    flex: 1,
    marginHorizontal: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  brandMarkText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  brandName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hero: {
    marginTop: 44,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.1,
  },
  title: {
    marginTop: 14,
    color: colors.ink,
    fontSize: 42,
    lineHeight: 50,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  subtitle: {
    marginTop: 18,
    maxWidth: 340,
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 24,
  },
  previewCard: {
    marginTop: 30,
    borderRadius: radii.lg,
    padding: 20,
    ...shadows.card,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  previewDate: {
    color: '#E3EEE8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A8D8C3',
  },
  previewRows: {
    gap: 11,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewNumber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNumberText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  previewLabel: {
    width: 55,
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  previewLine: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  previewLineFill: {
    height: '100%',
    borderRadius: 3,
    opacity: 0.85,
  },
  loginSection: {
    marginTop: 32,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '800',
  },
  sectionDescription: {
    marginTop: 7,
    marginBottom: 18,
    color: colors.inkSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  configNotice: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    marginBottom: 13,
    padding: 13,
    borderRadius: radii.sm,
    backgroundColor: colors.secondarySoft,
  },
  configNoticeText: {
    flex: 1,
    color: colors.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  errorNotice: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    marginBottom: 13,
    padding: 13,
    borderRadius: radii.sm,
    backgroundColor: '#F8E4DF',
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  providerList: {
    gap: 10,
  },
  providerButton: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  providerButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  providerBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerBadgeText: {
    fontSize: 17,
    fontWeight: '900',
  },
  providerLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  localButton: {
    marginTop: 13,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  localButtonPressed: {
    opacity: 0.65,
  },
  localButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  terms: {
    marginTop: 14,
    paddingHorizontal: 10,
    color: colors.inkFaint,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
});
