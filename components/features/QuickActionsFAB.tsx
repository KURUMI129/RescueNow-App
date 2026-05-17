import { memo, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  action: () => void;
}

interface QuickActionsFABProps {
  bottomOffset?: number;
  actions: QuickAction[];
}

const ITEM_SIZE = 48;
const ITEM_SPACING = 58;
const MAIN_SIZE = 56;
const LABEL_AREA = 150;

interface ActionRowProps {
  item: QuickAction;
  index: number;
  expanded: SharedValue<number>;
  onPress: (action: () => void) => void;
}

function ActionRow({ item, index, expanded, onPress }: ActionRowProps) {
  const itemStyle = useAnimatedStyle(() => {
    const scale = interpolate(expanded.value, [0, 1], [0.4, 1], Extrapolation.CLAMP);
    const opacity = interpolate(
      expanded.value,
      [0, 0.4, 1],
      [0, 0.1, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale }],
      opacity,
      // Hide from touch when collapsed so the invisible row doesn't eat taps
      pointerEvents: expanded.value > 0.5 ? "auto" : "none",
    } as any;
  });

  // Each item sits at its own bottom offset inside the tall container,
  // so it is never translated outside the parent bounds (Android would
  // otherwise drop the touch events).
  const bottom = MAIN_SIZE + 4 + index * ITEM_SPACING;

  return (
    <Animated.View
      style={[styles.actionItem, { bottom }, itemStyle]}
      pointerEvents="box-none"
    >
      <View style={styles.actionLabelWrap}>
        <Text style={styles.actionLabel} numberOfLines={1}>{item.label}</Text>
      </View>
      <Pressable
        onPress={() => onPress(item.action)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: item.color },
          pressed && { transform: [{ scale: 0.92 }] },
        ]}
      >
        <Ionicons name={item.icon} size={20} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

function QuickActionsFABComponent({ bottomOffset = 100, actions }: QuickActionsFABProps) {
  const insets = useSafeAreaInsets();
  const expanded = useSharedValue(0);
  // Track target state in a ref so taps mid-animation always flip correctly
  // (reading expanded.value directly returns interpolated values during the
  // spring, which caused the FAB to skip toggles).
  const isOpenRef = useRef(false);
  const [, force] = useState(0);

  const toggleExpanded = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = isOpenRef.current ? 0 : 1;
    isOpenRef.current = !isOpenRef.current;
    expanded.value = withSpring(next, {
      damping: 14,
      stiffness: 140,
    });
    force((n) => n + 1);
  };

  const handleActionPress = (action: () => void) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isOpenRef.current = false;
    expanded.value = withTiming(0, { duration: 200 });
    force((n) => n + 1);
    setTimeout(action, 120);
  };

  const mainButtonStyle = useAnimatedStyle(() => {
    const rotation = interpolate(expanded.value, [0, 1], [0, 135], Extrapolation.CLAMP);
    return { transform: [{ rotate: `${rotation}deg` }] };
  });

  // Container has to be tall enough to contain every expanded item; otherwise
  // Android clips child touch areas to the parent View bounds.
  const containerHeight = MAIN_SIZE + 8 + actions.length * ITEM_SPACING;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomOffset + insets.bottom,
          height: containerHeight,
          width: ITEM_SIZE + LABEL_AREA,
        },
      ]}
      pointerEvents="box-none"
    >
      {actions.map((item, index) => (
        <ActionRow
          key={item.label}
          item={item}
          index={index}
          expanded={expanded}
          onPress={handleActionPress}
        />
      ))}

      <Pressable
        onPress={toggleExpanded}
        style={styles.mainButtonWrapper}
        hitSlop={10}
      >
        <Animated.View style={[styles.mainButton, mainButtonStyle]}>
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    zIndex: 35,
  },
  actionItem: {
    position: "absolute",
    right: (MAIN_SIZE - ITEM_SIZE) / 2,
    flexDirection: "row",
    alignItems: "center",
  },
  actionLabelWrap: {
    backgroundColor: "rgba(11, 17, 32, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
    maxWidth: LABEL_AREA - 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  actionButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonWrapper: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: MAIN_SIZE,
    height: MAIN_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    width: MAIN_SIZE,
    height: MAIN_SIZE,
    borderRadius: MAIN_SIZE / 2,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
});

export const QuickActionsFAB = memo(QuickActionsFABComponent);
