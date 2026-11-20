import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Stop,
} from 'react-native-svg';

type TimerDialProps = {
  progress: number;
  children: ReactNode;
};

export function TimerDial({ progress, children }: TimerDialProps) {
  const size = 226;
  const center = size / 2;
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - safeProgress);
  const angle = safeProgress * Math.PI * 2 - Math.PI / 2;
  const dotX = center + Math.cos(angle) * radius;
  const dotY = center + Math.sin(angle) * radius;

  return (
    <View style={styles.root}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="timerStroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F2E9D5" />
            <Stop offset="0.55" stopColor="#C5D3CA" />
            <Stop offset="1" stopColor="#91AD9C" />
          </LinearGradient>
        </Defs>

        {Array.from({ length: 36 }, (_, index) => {
          const tickAngle = (index / 36) * Math.PI * 2 - Math.PI / 2;
          const inner = 104;
          const outer = index % 3 === 0 ? 109 : 107;
          return (
            <Line
              key={index}
              x1={center + Math.cos(tickAngle) * inner}
              y1={center + Math.sin(tickAngle) * inner}
              x2={center + Math.cos(tickAngle) * outer}
              y2={center + Math.sin(tickAngle) * outer}
              stroke="#FFFFFF"
              opacity={index / 36 <= safeProgress ? 0.26 : 0.08}
              strokeWidth={index % 3 === 0 ? 1.4 : 0.8}
              strokeLinecap="round"
            />
          );
        })}

        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={5}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#timerStroke)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
        <Circle cx={dotX} cy={dotY} r={4.5} fill="#F7EDD8" />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 226,
    height: 226,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
