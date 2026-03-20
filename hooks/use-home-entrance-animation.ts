import { useEffect, useMemo } from "react";
import { Animated } from "react-native";

type UseHomeEntranceAnimationParams = {
  reduceMotionEnabled: boolean;
};

export function useHomeEntranceAnimation({
  reduceMotionEnabled,
}: UseHomeEntranceAnimationParams) {
  const entranceOpacity = useMemo(() => new Animated.Value(0), []);
  const entranceTranslateY = useMemo(() => new Animated.Value(14), []);
  const sectionAnimValues = useMemo(
    () => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)],
    [],
  );

  useEffect(() => {
    if (reduceMotionEnabled) {
      entranceOpacity.setValue(1);
      entranceTranslateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslateY, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entranceOpacity, entranceTranslateY, reduceMotionEnabled]);

  useEffect(() => {
    if (reduceMotionEnabled) {
      sectionAnimValues.forEach((value) => value.setValue(1));
      return;
    }

    Animated.stagger(
      90,
      sectionAnimValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [sectionAnimValues, reduceMotionEnabled]);

  return {
    entranceOpacity,
    entranceTranslateY,
    sectionAnimValues,
  };
}
