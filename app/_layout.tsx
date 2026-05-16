import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { useActiveTheme } from "@/hooks/use-active-theme";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import AnimatedSplash from "./components/animated-splash";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useOnboarding } from "@/hooks/useOnboarding";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

export const unstable_settings = {
  anchor: "(auth)",
};

export default function RootLayout() {
  const activeTheme = useActiveTheme();
  const colors = HOME_THEME_COLORS[activeTheme];
  const { isCompleted, isLoading } = useOnboarding();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading && !isCompleted) {
      router.replace("/onboarding");
    }
  }, [isLoading, isCompleted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Memoize navigation theme so child screens don't re-render when the
  // RootLayout re-renders for unrelated reasons.
  const navigationTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.cardBorder,
      },
    }),
    [colors],
  );

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider value={navigationTheme}>
          {!isReady && <AnimatedSplash />}
          <Stack>
            <Stack.Screen
              name="onboarding"
              options={{ headerShown: false, statusBarHidden: true }}
            />
            <Stack.Screen
              name="(auth)"
              options={{ headerShown: false, statusBarHidden: true }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false, statusBarHidden: true }}
            />
            <Stack.Screen
              name="premium"
              options={{ headerShown: false, presentation: "modal", statusBarHidden: true }}
            />
          </Stack>
          <StatusBar hidden animated={false} />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
