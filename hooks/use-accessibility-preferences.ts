import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

type AccessibilityPreferences = {
  reduceMotionEnabled: boolean;
};

export function useAccessibilityPreferences(): AccessibilityPreferences {
  const [reduceMotionEnabled, setReduceMotionEnabled] =
    useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) {
        setReduceMotionEnabled(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduceMotionEnabled(enabled),
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return { reduceMotionEnabled };
}
