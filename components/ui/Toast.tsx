import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { SlideInDown, SlideOutUp, runOnJS } from "react-native-reanimated";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const TYPE_CONFIG: Record<
  ToastType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }
> = {
  success: {
    icon: "checkmark-circle",
    color: "#22C55E",
    bgColor: "rgba(34, 197, 94, 0.15)",
  },
  error: {
    icon: "alert-circle",
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
  },
  warning: {
    icon: "warning",
    color: "#EAB308",
    bgColor: "rgba(234, 179, 8, 0.15)",
  },
  info: {
    icon: "information-circle",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.15)",
  },
};

export function Toast({
  visible,
  message,
  type = "info",
  duration = 4000,
  onHide,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const config = TYPE_CONFIG[type];

  useEffect(() => {
    if (visible && onHide) {
      const timeout = setTimeout(() => {
        runOnJS(onHide)();
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutUp.duration(250)}
      style={[
        styles.container,
        { top: Math.max(insets.top, 60) + 16 },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.content, { backgroundColor: config.bgColor }]}>
        <View
          style={[styles.iconContainer, { backgroundColor: config.color + "20" }]}
        >
          <Ionicons
            name={config.icon}
            size={20}
            color={config.color}
          />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
       padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});