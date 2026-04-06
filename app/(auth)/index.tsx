import { useActiveTheme } from "@/hooks/use-active-theme";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BrandLogo } from "@/components/brand/brand-logo";
import { getAppCopy } from "@/constants/app-copy";
import { AppLanguage } from "@/constants/app-preferences";
import { AUTH_THEME_COLORS } from "@/constants/auth-theme";
import { useAppLanguage } from "@/hooks/use-app-language";

export default function AuthIntroScreen() {
  const router = useRouter();
  const activeTheme = useActiveTheme();
  const colors = AUTH_THEME_COLORS[activeTheme];
  const language = useAppLanguage();
  const t = getAppCopy(language as AppLanguage).auth; // We'll just define hardcoded text below since we lack the exact copy typing for index

  const redLightOpacity = useRef(new Animated.Value(0)).current;
  const blueLightOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;

  const isLightMode = activeTheme === "light";
  // The user requested aggressive blinking in the morning (light), subtle in the dark
  const maxBlinkValue = isLightMode ? 0.7 : 0.3;

  useEffect(() => {
    // 1. Initial logo pop-in
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // 2. Start the siren loop
    const redSeq = Animated.sequence([
      Animated.timing(redLightOpacity, { toValue: maxBlinkValue, duration: 250, useNativeDriver: true }),
      Animated.timing(redLightOpacity, { toValue: 0.1, duration: 250, useNativeDriver: true }),
    ]);

    const blueSeq = Animated.sequence([
      Animated.timing(blueLightOpacity, { toValue: 0.1, duration: 250, useNativeDriver: true }),
      Animated.timing(blueLightOpacity, { toValue: maxBlinkValue, duration: 250, useNativeDriver: true }),
    ]);

    const redLoop = Animated.loop(redSeq);
    const blueLoop = Animated.loop(blueSeq);

    redLoop.start();
    blueLoop.start();

    // 3. Stop after 2.5 seconds (simulated loading)
    const timeout = setTimeout(() => {
      redLoop.stop();
      blueLoop.stop();

      Animated.parallel([
        Animated.timing(redLightOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(blueLightOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(logoTranslateY, { toValue: -60, duration: 800, useNativeDriver: true }),
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
      ]).start();
    }, 2500);

    return () => {
      clearTimeout(timeout);
      redLoop.stop();
      blueLoop.stop();
    };
  }, [blueLightOpacity, buttonsOpacity, logoScale, logoTranslateY, maxBlinkValue, redLightOpacity]);

  // Solid button styles for visibility
  const secondaryBg = isLightMode ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.08)";
  const secondaryBorder = isLightMode ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.15)";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Luces de Sirena */}
      <Animated.View style={[styles.sirenLight, { backgroundColor: "#E11D48", top: "20%", left: "-20%", opacity: redLightOpacity }]} />
      <Animated.View style={[styles.sirenLight, { backgroundColor: "#0EA5E9", bottom: "30%", right: "-20%", opacity: blueLightOpacity }]} />

      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: logoScale }, { translateY: logoTranslateY }], alignItems: "center" }}>
          <BrandLogo width={120} height={120} />
          <Text style={[styles.appName, { color: colors.textPrimary }]}>Rescue<Text style={{ color: colors.primary }}>Now</Text></Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {language === "es" ? "Asistencia táctica inmediata." : "Immediate tactical assistance."}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, { opacity: buttonsOpacity }]}>
          <TouchableOpacity
            style={[styles.primaryButton]}
            activeOpacity={0.8}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={[styles.primaryButtonText]}>
              {language === "es" ? "Iniciar Sesión" : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: secondaryBg, borderColor: secondaryBorder }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
              {language === "es" ? "Crear Cuenta" : "Create Account"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sirenLight: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: "900",
    marginTop: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    letterSpacing: 0.3,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 56,
    width: "100%",
    gap: 14,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E11D48",
    shadowColor: "#E11D48",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
