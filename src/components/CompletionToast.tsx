import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows } from '../theme';

type CompletionToastProps = {
  message: string | null;
  onDone: () => void;
};

export function CompletionToast({ message, onDone }: CompletionToastProps) {
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!message) return;
    setVisibleMessage(message);
    opacity.setValue(0);
    translateY.setValue(10);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        setVisibleMessage(null);
        onDoneRef.current();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [message, opacity, translateY]);

  if (!visibleMessage) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.icon}>
        <Ionicons name="checkmark" size={17} color={colors.white} />
      </View>
      <Text style={styles.message}>{visibleMessage}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 92,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: '#30483D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
    ...shadows.card,
    elevation: 12,
  },
  icon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.longTerm,
  },
  message: {
    flex: 1,
    color: '#FFFBF4',
    fontFamily: 'serif',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
