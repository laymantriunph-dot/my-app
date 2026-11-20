import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, shadows } from '../theme';

type MotivationModalProps = {
  visible: boolean;
  value: string;
  defaultValue: string;
  onClose: () => void;
  onSave: (value: string) => Promise<void>;
};

export function MotivationModal({
  visible,
  value,
  defaultValue,
  onClose,
  onSave,
}: MotivationModalProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);

  async function save() {
    await onSave(draft);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) + 8 },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.headingRow}>
            <View>
              <Text style={styles.eyebrow}>YOUR WORDS</Text>
              <Text style={styles.title}>今天想对自己说什么？</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="关闭"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.ink} />
            </Pressable>
          </View>
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            maxLength={28}
            placeholder={defaultValue}
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
          />
          <Text style={styles.hint}>
            留空会恢复默认的“{defaultValue}”。
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void save()}
            style={styles.saveButton}
          >
            <Text style={styles.saveText}>保存这句话</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 10,
    paddingHorizontal: 22,
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
  headingRow: {
    marginTop: 18,
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
    fontSize: 23,
    fontWeight: '800',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  input: {
    height: 58,
    marginTop: 20,
    paddingHorizontal: 15,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    marginTop: 8,
    color: colors.inkFaint,
    fontSize: 10,
  },
  saveButton: {
    height: 54,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
  },
  saveText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
