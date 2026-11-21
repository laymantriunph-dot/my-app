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
  const translateY = useRef(new Animated.Value(-8)).current;
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!message) return;
    setVisibleMessage(message);
    opacity.setValue(0);
    translateY.setValue(-8);

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
          toValue: -6,
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
        <Ionicons name="checkmark" size={14} color={colors.longTerm} />
      </View>
      <Text numberOfLines={2} style={styles.message}>
        {visibleMessage}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 10,
    left: 48,
    right: 48,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.md,
    backgroundColor: 'rgba(254,254,252,0.97)',
    borderWidth: 1,
    borderColor: colors.line,
    zIndex: 100,
    ...shadows.card,
    elevation: 6,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.longTermSoft,
  },
  message: {
    flex: 1,
    color: colors.inkSoft,
    fontFamily: 'serif',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
});
