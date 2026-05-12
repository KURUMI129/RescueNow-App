import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TUTORIAL_KEY = "@rescuenow_tutorial_v1";

interface UseTutorialReturn {
  wasShown: boolean;
  isLoading: boolean;
  markAsShown: () => Promise<void>;
}

export function useTutorial(): UseTutorialReturn {
  const [wasShown, setWasShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTutorial = async () => {
      try {
        const value = await AsyncStorage.getItem(TUTORIAL_KEY);
        setWasShown(value === "true");
      } catch (error) {
        console.warn("[useTutorial] Error reading:", error);
        setWasShown(false);
      } finally {
        setIsLoading(false);
      }
    };

    void checkTutorial();
  }, []);

  const markAsShown = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, "true");
      setWasShown(true);
    } catch (error) {
      console.warn("[useTutorial] Error saving:", error);
    }
  }, []);

  return { wasShown, isLoading, markAsShown };
}