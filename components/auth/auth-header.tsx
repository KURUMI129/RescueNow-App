import { useActiveTheme } from "@/hooks/use-active-theme";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AuthThemeColors } from "@/constants/auth-theme";

type AuthHeaderProps = {
  colors: AuthThemeColors;
};

export function AuthHeader({ colors }: AuthHeaderProps) {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 110,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.logoGlow}>
        <BrandLogo width={200} height={180} />
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tu salvavidas experto
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 26,
    alignItems: "center",
  },
  logoGlow: {
    shadowColor: "#EAB308",
    shadowOpacity: 0.25,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 14,
    lineHeight: 20,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
