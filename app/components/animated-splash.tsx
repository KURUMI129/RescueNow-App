import { useEffect, useCallback } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";

const { width } = Dimensions.get("window");

const PRIMARY_COLOR = "#0047AB";
const ANIMATION_DURATION = 800;

export default function AnimatedSplash() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    scale.value = withDelay(
      200,
      withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.back(1.5)),
      })
    );

    textOpacity.value = withDelay(
      600,
      withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      })
    );

    containerOpacity.value = withDelay(
      1800,
      withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );

    const timeout = setTimeout(() => {
      runOnJS(hideSplash)();
    }, 2200);

    return () => clearTimeout(timeout);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value > 0 ? 1 : 0,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🆘</Text>
        </View>
      </Animated.View>
      <Animated.Text style={[styles.appName, textAnimatedStyle]}>
        Rescue Now
      </Animated.Text>
      <Animated.Text style={[styles.tagline, textAnimatedStyle]}>
        Tu asisten de emergencia
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 56,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
});