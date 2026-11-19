import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/components/HomeScreen';
import { LoginScreen } from './src/components/LoginScreen';
import { useAuth } from './src/hooks/useAuth';
import { useTasks } from './src/hooks/useTasks';
import { colors } from './src/theme';

function AppContent() {
  const auth = useAuth();
  const [isLocalMode, setIsLocalMode] = useState(false);
  const userId = auth.session?.user.id;
  const taskState = useTasks(userId);

  if (auth.isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingMark}>
          <Text style={styles.loadingMarkText}>三</Text>
        </View>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>正在准备今天的清单</Text>
      </View>
    );
  }

  if (!auth.session && !isLocalMode) {
    return (
      <LoginScreen auth={auth} onStartLocal={() => setIsLocalMode(true)} />
    );
  }

  return (
    <HomeScreen
      user={auth.session?.user ?? null}
      isLocal={!auth.session}
      taskState={taskState}
      onSignOut={() => void auth.signOut()}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.canvas,
  },
  loadingMark: {
    width: 58,
    height: 58,
    marginBottom: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  loadingMarkText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  loadingText: {
    color: colors.inkSoft,
    fontSize: 12,
  },
});
