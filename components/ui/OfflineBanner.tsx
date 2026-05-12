import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import NetInfo from "@react-native-community/netinfo";

interface OfflineBannerProps {
  onRetry?: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    translateY.value = withTiming(isConnected === false ? 0 : -100, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [isConnected, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top, paddingTop: insets.top > 0 ? 0 : 8 },
        animatedStyle,
      ]}
    >
      <Ionicons name="wifi-outline" size={16} color="#7A6200" />
      <Text style={styles.text}>Sin conexión a internet</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#FFE566",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 9999,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7A6200",
  },
});
