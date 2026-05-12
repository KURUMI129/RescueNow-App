import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

import { useActiveTheme } from "@/hooks/use-active-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { DESIGN_TOKENS } from "@/constants/design-tokens";

interface SkeletonProps {
  width: number;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const activeTheme = useActiveTheme();
  const tokens = DESIGN_TOKENS[activeTheme];
  const { reduceMotionEnabled } = useAccessibilityPreferences();

  const translateX = useSharedValue(-width);

  useEffect(() => {
    if (reduceMotionEnabled) {
      return;
    }

    translateX.value = withRepeat(
      withTiming(width * 2, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [translateX, width, reduceMotionEnabled]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reduceMotionEnabled ? 0 : translateX.value }],
  }));

  const baseColor = activeTheme === "dark" ? "#1E293B" : "#E2E8F0";
  const highlightColor = activeTheme === "dark" ? "#334155" : "#F1F5F9";

  return (
    <View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      {!reduceMotionEnabled && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              width: width * 0.5,
              height: height,
              borderRadius,
              backgroundColor: highlightColor,
            },
            shimmerStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});