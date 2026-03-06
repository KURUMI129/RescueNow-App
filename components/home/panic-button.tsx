import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { HomeThemeColors } from '@/constants/home-theme';

type PanicButtonProps = {
  colors: HomeThemeColors;
  onPress: () => void;
};

export function PanicButton({ colors, onPress }: PanicButtonProps) {
  const pulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [pulse]);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            borderColor: colors.danger,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.button, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={styles.buttonTitle}>PANICO</Text>
        <Text style={styles.buttonSubtitle}>Asistencia inmediata</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    opacity: 0.35,
  },
  button: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7f1d1d',
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  buttonTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1,
  },
  buttonSubtitle: {
    marginTop: 3,
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
