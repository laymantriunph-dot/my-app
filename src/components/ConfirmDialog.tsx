import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radii, shadows } from '../theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  embedded?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = 'delete',
  embedded = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const content = (
      <View style={[styles.root, embedded && styles.embeddedRoot]}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.dialog}>
          <View style={styles.icon}>
            <Ionicons name="trash-outline" size={21} color={colors.danger} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="cancel action"
              onPress={onCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="confirm delete"
              onPress={onConfirm}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
  );

  if (embedded) {
    return visible ? content : null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  embeddedRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(18, 25, 21, 0.48)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  icon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F7E3DE',
  },
  title: {
    marginTop: 16,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    marginTop: 8,
    color: colors.inkSoft,
    fontSize: 12,
    lineHeight: 19,
  },
  actions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 9,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
  },
  cancelText: {
    color: colors.inkSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.danger,
  },
  confirmText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
