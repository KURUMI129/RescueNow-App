import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { HOME_THEME_COLORS } from "@/constants/home-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? HOME_THEME_COLORS.dark : HOME_THEME_COLORS.light;

  const renderTabIcon = (
    name: React.ComponentProps<typeof IconSymbol>["name"],
    color: string,
    focused: boolean,
  ) => (
    <View
      style={[
        styles.iconWrap,
        {
          backgroundColor: focused ? colors.primary : "transparent",
          borderColor: focused ? colors.primary : colors.cardBorder,
        },
      ]}
    >
      <IconSymbol
        size={20}
        name={name}
        color={focused ? colors.onPrimary : color}
      />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 18,
          height: 78,
          paddingBottom: 12,
          paddingTop: 12,
          paddingHorizontal: 10,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          borderRadius: 24,
          backgroundColor: colors.surface,
          elevation: 10,
          shadowColor: "#0F172A",
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 10 },
          shadowRadius: 18,
        },
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon("house.fill", color, focused),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="technicians"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="technician-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="options"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon("gearshape.fill", color, focused),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  item: {
    borderRadius: 18,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 2,
  },
});
