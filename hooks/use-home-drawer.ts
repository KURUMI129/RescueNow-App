import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import { Animated, PanResponder } from "react-native";

const DRAWER_WIDTH = 264;
const DRAWER_CLOSE_THRESHOLD = 84;
const DRAWER_OPEN_THRESHOLD = 72;
const DRAWER_EDGE_SWIPE_WIDTH = 24;

type UseHomeDrawerParams = {
  reduceMotionEnabled: boolean;
  windowWidth: number;
};

export function useHomeDrawer({
  reduceMotionEnabled,
  windowWidth,
}: UseHomeDrawerParams) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerBackdropOpacity = useMemo(() => new Animated.Value(0), []);
  const drawerTranslateX = useMemo(() => new Animated.Value(DRAWER_WIDTH), []);
  const drawerItemAnimValues = useMemo(
    () => [
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
    ],
    [],
  );

  const triggerDrawerHaptic = useCallback(() => {
    if (reduceMotionEnabled) {
      return;
    }

    void Haptics.selectionAsync();
  }, [reduceMotionEnabled]);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);

    if (reduceMotionEnabled) {
      drawerBackdropOpacity.setValue(1);
      drawerTranslateX.setValue(0);
      drawerItemAnimValues.forEach((value) => value.setValue(1));
      return;
    }

    drawerTranslateX.setValue(DRAWER_WIDTH);
    drawerBackdropOpacity.setValue(0);
    drawerItemAnimValues.forEach((value) => value.setValue(0));

    Animated.parallel([
      Animated.timing(drawerBackdropOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(drawerTranslateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      triggerDrawerHaptic();
      Animated.stagger(
        40,
        drawerItemAnimValues.map((value) =>
          Animated.timing(value, {
            toValue: 1,
            duration: 170,
            useNativeDriver: true,
          }),
        ),
      ).start();
    });
  }, [
    drawerBackdropOpacity,
    drawerItemAnimValues,
    drawerTranslateX,
    reduceMotionEnabled,
    triggerDrawerHaptic,
  ]);

  const closeDrawer = useCallback(
    (onClosed?: () => void) => {
      if (reduceMotionEnabled) {
        drawerBackdropOpacity.setValue(0);
        drawerTranslateX.setValue(DRAWER_WIDTH);
        drawerItemAnimValues.forEach((value) => value.setValue(0));
        setIsDrawerOpen(false);
        triggerDrawerHaptic();
        onClosed?.();
        return;
      }

      drawerItemAnimValues.forEach((value) => value.setValue(0));

      Animated.parallel([
        Animated.timing(drawerBackdropOpacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(drawerTranslateX, {
          toValue: DRAWER_WIDTH,
          duration: 170,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsDrawerOpen(false);
        triggerDrawerHaptic();
        onClosed?.();
      });
    },
    [
      drawerBackdropOpacity,
      drawerItemAnimValues,
      drawerTranslateX,
      reduceMotionEnabled,
      triggerDrawerHaptic,
    ],
  );

  const navigateFromDrawer = useCallback(
    (path: string, onNavigate: (path: string) => void) => {
      closeDrawer(() => {
        onNavigate(path);
      });
    },
    [closeDrawer],
  );

  const drawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 8 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          const nextTranslate = Math.min(
            Math.max(gestureState.dx, 0),
            DRAWER_WIDTH,
          );
          drawerTranslateX.setValue(nextTranslate);

          const nextOpacity = 1 - nextTranslate / DRAWER_WIDTH;
          drawerBackdropOpacity.setValue(nextOpacity);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > DRAWER_CLOSE_THRESHOLD) {
            closeDrawer();
            return;
          }

          Animated.parallel([
            Animated.timing(drawerBackdropOpacity, {
              toValue: 1,
              duration: 140,
              useNativeDriver: true,
            }),
            Animated.timing(drawerTranslateX, {
              toValue: 0,
              duration: 160,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [closeDrawer, drawerBackdropOpacity, drawerTranslateX],
  );

  const drawerEdgePanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !isDrawerOpen &&
          gestureState.x0 >= windowWidth - DRAWER_EDGE_SWIPE_WIDTH - 8 &&
          gestureState.dx < -8 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderGrant: () => {
          setIsDrawerOpen(true);
          drawerTranslateX.setValue(DRAWER_WIDTH);
          drawerBackdropOpacity.setValue(0);
        },
        onPanResponderMove: (_, gestureState) => {
          const nextTranslate = Math.min(
            Math.max(DRAWER_WIDTH + gestureState.dx, 0),
            DRAWER_WIDTH,
          );
          drawerTranslateX.setValue(nextTranslate);

          const nextOpacity = 1 - nextTranslate / DRAWER_WIDTH;
          drawerBackdropOpacity.setValue(nextOpacity);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (-gestureState.dx > DRAWER_OPEN_THRESHOLD) {
            Animated.parallel([
              Animated.timing(drawerBackdropOpacity, {
                toValue: 1,
                duration: 140,
                useNativeDriver: true,
              }),
              Animated.timing(drawerTranslateX, {
                toValue: 0,
                duration: 160,
                useNativeDriver: true,
              }),
            ]).start(() => {
              triggerDrawerHaptic();
            });
            return;
          }

          closeDrawer();
        },
      }),
    [
      closeDrawer,
      drawerBackdropOpacity,
      drawerTranslateX,
      isDrawerOpen,
      triggerDrawerHaptic,
      windowWidth,
    ],
  );

  return {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    navigateFromDrawer,
    drawerBackdropOpacity,
    drawerTranslateX,
    drawerItemAnimValues,
    drawerPanResponder,
    drawerEdgePanResponder,
    drawerEdgeSwipeWidth: DRAWER_EDGE_SWIPE_WIDTH,
  };
}
