import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHIMES, type ChimeId } from '../chimes';
import { colors, radii, shadows } from '../theme';

type ChimePickerModalProps = {
  visible: boolean;
  selectedId: ChimeId;
  onClose: () => void;
  onSelect: (id: ChimeId) => void;
};

export function ChimePickerModal({
  visible,
  selectedId,
  onClose,
  onSelect,
}: ChimePickerModalProps) {
  const insets = useSafeAreaInsets();
  const player = useAudioPlayer(CHIMES[0].source);

  function preview(id: ChimeId) {
    const chime = CHIMES.find((item) => item.id === id) ?? CHIMES[0];
    player.replace(chime.source);
    player.play();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 18) + 8 },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>COMPLETION CHIME</Text>
              <Text style={styles.title}>选择结束铃声</Text>
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
          <Text style={styles.subtitle}>
            十种为学习与专注设计的柔和提示音。
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {CHIMES.map((chime, index) => {
              const selected = chime.id === selectedId;

              return (
                <Pressable
                  key={chime.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(chime.id)}
                  style={[
                    styles.option,
                    selected && styles.optionSelected,
                  ]}
                >
                  <Text style={styles.index}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionLabel}>{chime.label}</Text>
                    <Text style={styles.optionHint}>{chime.hint}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`试听 ${chime.label}`}
                    hitSlop={8}
                    onPress={() => preview(chime.id)}
                    style={styles.previewButton}
                  >
                    <Ionicons name="play" size={15} color={colors.longTerm} />
                  </Pressable>
                  <View
                    style={[
                      styles.radio,
                      selected && styles.radioSelected,
                    ]}
                  >
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 27, 23, 0.38)',
  },
  sheet: {
    maxHeight: '90%',
    paddingTop: 10,
    paddingHorizontal: 20,
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
  header: {
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  title: {
    marginTop: 5,
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 13,
    color: colors.inkSoft,
    fontSize: 11,
  },
  list: {
    flexGrow: 0,
    maxHeight: 520,
  },
  listContent: {
    gap: 7,
    paddingBottom: 8,
  },
  option: {
    minHeight: 62,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  optionSelected: {
    backgroundColor: '#EDF2EE',
    borderColor: colors.longTerm,
  },
  index: {
    width: 22,
    color: colors.inkFaint,
    fontFamily: 'serif',
    fontSize: 12,
    fontWeight: '700',
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  optionHint: {
    marginTop: 3,
    color: colors.inkFaint,
    fontSize: 9,
  },
  previewButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.longTermSoft,
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  radioSelected: {
    borderColor: colors.longTerm,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.longTerm,
  },
});
