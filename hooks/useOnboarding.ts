import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "@rescuenow_onboarding_v1";

interface UseOnboardingReturn {
  isCompleted: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setIsCompleted(value === "true");
      } catch (error) {
        console.warn("[useOnboarding] Error reading:", error);
        setIsCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    void checkOnboarding();
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setIsCompleted(true);
    } catch (error) {
      console.warn("[useOnboarding] Error saving:", error);
    }
  }, []);

  return { isCompleted, isLoading, completeOnboarding };
}