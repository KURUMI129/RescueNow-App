import { usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import MapView from "react-native-maps";

import { HomeDrawer } from "@/components/home/home-drawer";
import { HomeHeader } from "@/components/home/home-header";
import { HomeMapCard } from "@/components/home/home-map-card";
import { HomeQuickActions } from "@/components/home/home-quick-actions";
import { NearbyTechnicians } from "@/components/home/nearby-technicians";
import { PanicButton } from "@/components/home/panic-button";
import { getAppCopy } from "@/constants/app-copy";
import {
  getHomeDrawerPathFromAction,
  getHomeDrawerRouteFromPath,
  HomeDrawerActionId,
  HomeDrawerRouteId,
  HOME_DRAWER_PATHS,
} from "@/constants/home-drawer-routes";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useHomeEntranceAnimation } from "@/hooks/use-home-entrance-animation";
import { useHomeDrawer } from "@/hooks/use-home-drawer";
import { useLiveMap } from "@/hooks/use-live-map";

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const mapRef = useRef<MapView | null>(null);
  const { width: windowWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;
  const { reduceMotionEnabled } = useAccessibilityPreferences();
  const language = useAppLanguage();
  const [panicCount, setPanicCount] = useState<number>(0);
  const { entranceOpacity, entranceTranslateY, sectionAnimValues } =
    useHomeEntranceAnimation({ reduceMotionEnabled });

  const copy = getAppCopy(language);
  const t = copy.tabs.home;
  const { region, isLocating, locationError, technicians } = useLiveMap({
    categories: copy.categories,
    language,
    locationPermissionError: t.locationPermissionError,
    locationErrorMessage: t.locationError,
  });
  const activeDrawerRoute: HomeDrawerRouteId = useMemo(
    () => getHomeDrawerRouteFromPath(pathname),
    [pathname],
  );
  const {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    navigateFromDrawer,
    drawerBackdropOpacity,
    drawerTranslateX,
    drawerItemAnimValues,
    drawerPanResponder,
    drawerEdgePanResponder,
    drawerEdgeSwipeWidth,
  } = useHomeDrawer({
    reduceMotionEnabled,
    windowWidth,
  });

  const mapRegion = useMemo(() => region, [region]);

  const handlePanicPress = () => {
    setPanicCount((prev) => prev + 1);
  };

  const handleCenterMap = () => {
    mapRef.current?.animateToRegion(mapRegion, 450);
  };

  const handleDrawerAction = useCallback(
    (actionId: HomeDrawerActionId) => {
      if (actionId === "logout") {
        closeDrawer(() => {
          router.replace(HOME_DRAWER_PATHS.logout);
        });
        return;
      }

      navigateFromDrawer(getHomeDrawerPathFromAction(actionId), (nextPath) => {
        router.push(nextPath as never);
      });
    },
    [closeDrawer, navigateFromDrawer, router],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.entranceLayer,
            {
              opacity: entranceOpacity,
              transform: [{ translateY: entranceTranslateY }],
            },
          ]}
        >
          <HomeHeader
            colors={colors}
            tagline={t.tagline}
            openSettingsLabel={t.openSettings}
            onOpenDrawer={openDrawer}
          />

          <HomeMapCard
            colors={colors}
            mapRef={mapRef}
            mapRegion={mapRegion}
            isLocating={isLocating}
            technicians={technicians}
            locatingText={t.locating}
            centerMapLabel={t.centerMap}
            etaPrefix={t.etaPrefix}
            onCenterMap={handleCenterMap}
          />

          {locationError ? (
            <Text style={[styles.locationErrorText, { color: colors.danger }]}>
              {locationError}
            </Text>
          ) : null}

          <HomeQuickActions
            colors={colors}
            requestServiceTitle={t.requestService}
            requestServiceSubtitle={t.requestServiceSub}
            trackingTitle={t.tracking}
            trackingSubtitle={t.trackingSub}
            sectionAnimValues={sectionAnimValues}
          />

          <Animated.View
            style={{
              opacity: sectionAnimValues[2],
              transform: [
                {
                  translateY: sectionAnimValues[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            }}
          >
            <PanicButton colors={colors} onPress={handlePanicPress} />
          </Animated.View>

          <Text style={[styles.panicCounter, { color: colors.textSecondary }]}>
            {t.panicCounter(panicCount)}
          </Text>

          <NearbyTechnicians
            colors={colors}
            data={technicians}
            title={t.nearbyTitle}
            etaPrefix={t.etaPrefix}
          />
        </Animated.View>
      </ScrollView>

      {!isDrawerOpen ? (
        <View
          style={[styles.drawerEdgeSwipeZone, { width: drawerEdgeSwipeWidth }]}
          pointerEvents="auto"
          {...drawerEdgePanResponder.panHandlers}
        />
      ) : null}

      <HomeDrawer
        visible={isDrawerOpen}
        colors={colors}
        copy={t}
        activeRoute={activeDrawerRoute}
        drawerBackdropOpacity={drawerBackdropOpacity}
        drawerTranslateX={drawerTranslateX}
        drawerItemAnimValues={drawerItemAnimValues}
        drawerPanHandlers={drawerPanResponder.panHandlers}
        onClose={closeDrawer}
        onAction={handleDrawerAction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
  },
  entranceLayer: {
    gap: 0,
  },
  locationErrorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  panicCounter: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  drawerEdgeSwipeZone: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
});
