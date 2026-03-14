import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { getAppCopy } from "@/constants/app-copy";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(auth)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const language = useAppLanguage();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const navigationCopy = getAppCopy(language).navigation;
  const navigationTheme =
    colorScheme === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.textPrimary,
            border: colors.cardBorder,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.textPrimary,
            border: colors.cardBorder,
          },
        };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false, statusBarHidden: true }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, statusBarHidden: true }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: navigationCopy.emergencyModal,
            statusBarHidden: true,
          }}
        />
      </Stack>
      <StatusBar hidden animated={false} />
    </ThemeProvider>
  );
}
