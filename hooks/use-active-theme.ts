import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import {
    ThemeMode,
    getAppPreferences,
    subscribeToAppPreferences,
} from "@/constants/app-preferences";

export function useActiveTheme(): "light" | "dark" {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>("time");
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadThemeMode = useCallback(async () => {
    const appPreferences = await getAppPreferences();
    setThemeMode(appPreferences.themeMode);
  }, []);

  // Update time every minute to correctly flip the switch if app stays open
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadThemeMode();

    return subscribeToAppPreferences((preferences) => {
      setThemeMode(preferences.themeMode);
    });
  }, [loadThemeMode]);

  useFocusEffect(
    useCallback(() => {
      void loadThemeMode();
    }, [loadThemeMode]),
  );

  if (themeMode === "light") return "light";
  if (themeMode === "dark") return "dark";
  if (themeMode === "system") return systemColorScheme === "dark" ? "dark" : "light";

  // themeMode === "time" (8 PM to 7 AM is dark)
  const currentHour = currentTime.getHours();
  if (currentHour >= 20 || currentHour < 7) {
    return "dark";
  }

  return "light";
}
