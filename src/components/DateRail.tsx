import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { colors } from '../theme';

type DayOption = {
  key: string;
  label: string;
  shortDate: string;
};

type DateRailProps = {
  days: DayOption[];
  selectedDate: string;
  counts: Record<string, number>;
  onSelect: (date: string) => void;
};

export function DateRail({
  days,
  selectedDate,
  counts,
  onSelect,
}: DateRailProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>PLAN AHEAD</Text>
        <Text style={styles.hint}>未来任务会按时进入清单</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {days.map((day) => {
          const selected = day.key === selectedDate;
          const count = counts[day.key] ?? 0;

          return (
            <Pressable
              key={day.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onSelect(day.key)}
              style={[
                styles.day,
                selected && styles.daySelected,
              ]}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {day.label}
              </Text>
              <Text style={[styles.date, selected && styles.dateSelected]}>
                {day.shortDate}
              </Text>
              {count > 0 ? (
                <View
                  style={[
                    styles.count,
                    selected && styles.countSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      selected && styles.countTextSelected,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 14,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  eyebrow: {
    color: colors.inkFaint,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  hint: {
    color: colors.inkFaint,
    fontSize: 8,
  },
  rail: {
    gap: 7,
    paddingTop: 8,
    paddingBottom: 2,
  },
  day: {
    width: 56,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  daySelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    color: colors.inkFaint,
    fontSize: 8,
    fontWeight: '700',
  },
  labelSelected: {
    color: '#CFC7B3',
  },
  date: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  dateSelected: {
    color: colors.white,
  },
  count: {
    position: 'absolute',
    right: 4,
    top: 4,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: colors.accentSoft,
  },
  countSelected: {
    backgroundColor: '#E8DDC6',
  },
  countText: {
    color: colors.accent,
    fontSize: 7,
    fontWeight: '800',
  },
  countTextSelected: {
    color: colors.ink,
  },
});
