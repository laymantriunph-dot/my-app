import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Stop,
} from 'react-native-svg';

type ProgressDialProps = {
  percentage: number;
  size?: number;
};

export function ProgressDial({
  percentage,
  size = 126,
}: ProgressDialProps) {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const center = size / 2;
  const radius = size * 0.38;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - safePercentage / 100);
  const endpointAngle = (safePercentage / 100) * Math.PI * 2 - Math.PI / 2;
  const endpointX = center + Math.cos(endpointAngle) * radius;
  const endpointY = center + Math.sin(endpointAngle) * radius;
  const ticks = Array.from({ length: 24 }, (_, index) => index);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressStroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#EDE3D0" />
            <Stop offset="1" stopColor="#C5D3CA" />
          </LinearGradient>
        </Defs>

        {ticks.map((tick) => {
          const angle = (tick / ticks.length) * Math.PI * 2 - Math.PI / 2;
          const inner = radius + size * 0.075;
          const outer = radius + size * 0.095;
          const active = tick / ticks.length <= safePercentage / 100;

          return (
            <Line
              key={tick}
              x1={center + Math.cos(angle) * inner}
              y1={center + Math.sin(angle) * inner}
              x2={center + Math.cos(angle) * outer}
              y2={center + Math.sin(angle) * outer}
              stroke={active ? '#EDE3D0' : '#FFFFFF'}
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={active ? 0.88 : 0.12}
            />
          );
        })}

        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#FFFFFF"
          strokeWidth={7}
          opacity={0.1}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressStroke)"
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
        <Circle
          cx={endpointX}
          cy={endpointY}
          r={4.5}
          fill="#F2E8D5"
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.percentage}>{safePercentage}</Text>
        <Text style={styles.percentSign}>%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    color: '#FFFDF7',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '300',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  percentSign: {
    marginTop: -8,
    marginLeft: 2,
    color: '#DDE7E1',
    fontSize: 12,
    fontWeight: '700',
  },
});
