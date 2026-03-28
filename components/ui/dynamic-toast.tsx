import { useActiveTheme } from "@/hooks/use-active-theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { HOME_THEME_COLORS } from "@/constants/home-theme";

interface DynamicToastProps {
  visible: boolean;
  title: string;
  message: string;
  onPress?: () => void;
  onHide?: () => void;
  duration?: number;
}

export function DynamicToast({
  visible,
  title,
  message,
  onPress,
  onHide,
  duration = 5000,
}: DynamicToastProps) {
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const isLight = activeTheme === "light";

  const translateY = useRef(new Animated.Value(-150)).current;

  // Local state to keep the component mounted during exit animation
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(translateY, {
        toValue: Platform.OS === "ios" ? 50 : 30, // Drop below notch/dynamic island
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();

      let isCancelled = false;
      const hideTimeout = setTimeout(() => {
        if (!isCancelled && onHide) {
          onHide();
        }
      }, duration);

      return () => {
        isCancelled = true;
        clearTimeout(hideTimeout);
      };
    } else {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
      });
    }
  }, [visible, duration, onHide, translateY]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[
        styles.globalWrapper,
        {
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (onPress) onPress();
          if (onHide) onHide();
        }}
        style={[
          styles.container,
          {
            backgroundColor: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(30, 30, 35, 0.95)",
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#000" />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  globalWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999, // Ensure it's above everything
    elevation: 9999,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    maxWidth: 400,
    padding: 12,
    borderRadius: 30, // Pill shaped like dynamic island expansion
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
});
