import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";

import {
    AppLanguage,
    getAppPreferences,
    subscribeToAppPreferences,
} from "@/constants/app-preferences";

export function useAppLanguage(defaultLanguage: AppLanguage = "es") {
  const [language, setLanguage] = useState<AppLanguage>(defaultLanguage);

  const loadLanguage = useCallback(async () => {
    const appPreferences = await getAppPreferences();
    setLanguage(appPreferences.language);
  }, []);

  useEffect(() => {
    void loadLanguage();

    return subscribeToAppPreferences((preferences) => {
      setLanguage(preferences.language);
    });
  }, [loadLanguage]);

  useFocusEffect(
    useCallback(() => {
      void loadLanguage();
    }, [loadLanguage]),
  );

  return language;
}
