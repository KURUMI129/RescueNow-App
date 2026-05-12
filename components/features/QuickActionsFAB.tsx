import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  action: () => void;
}

interface QuickActionsFABProps {
  bottomOffset?: number;
}

const ACTIONS: QuickAction[] = [
  {
    label: "Llamar 911",
    icon: "call",
    color: "#E11D48",
    action: () => Linking.openURL("tel:911"),
  },
  {
    label: "Check-in",
    icon: "shield-checkmark",
    color: "#10B981",
    action: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  },
  {
    label: "Compartir ubicación",
    icon: "share-outline",
    color: "#0EA5E9",
    action: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  },
];

export function QuickActionsFAB({ bottomOffset = 100 }: QuickActionsFABProps) {
  const insets = useSafeAreaInsets();
  const expanded = useSharedValue(0);

  const toggleExpanded = () => {
    const newValue = expanded.value === 0 ? 1 : 0;
    expanded.value = withSpring(newValue, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handleActionPress = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
    expanded.value = withSpring(0, { damping: 15, stiffness: 150 });
  };

  const containerStyle = useAnimatedStyle(() => ({
    bottom: bottomOffset + insets.bottom,
  }));

  const actionsContainerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      expanded.value,
      [0, 1],
      [0, -200],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      expanded.value,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const mainButtonStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      expanded.value,
      [0, 1],
      [0, 45],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.actionsContainer, actionsContainerStyle]}>
        {ACTIONS.map((item, index) => (
          <View
            key={item.label}
            style={[styles.actionItem, { bottom: (index + 1) * 60 }]}
          >
            <Text style={[styles.actionLabel, { color: item.color }]}>
              {item.label}
            </Text>
            <Pressable
              onPress={() => handleActionPress(item.action)}
              style={[styles.actionButton, { backgroundColor: item.color }]}
            >
              <Ionicons name={item.icon} size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        )).reverse()}
      </Animated.View>

      <Pressable onPress={toggleExpanded} style={styles.mainButtonWrapper}>
        <Animated.View style={mainButtonStyle}>
          <View style={styles.mainButton}>
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    alignItems: "center",
    zIndex: 25,
  },
  actionsContainer: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
  },
  actionItem: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    right: 56,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginRight: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainButtonWrapper: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
});