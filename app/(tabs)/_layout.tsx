import { getAppCopy } from "@/constants/app-copy";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Redirect, Tabs } from "expo-router";

export default function TabLayout() {
  const { isAuthLoading, isAuthenticated } = useAuthSession();
  const language = useAppLanguage();
  const navigationCopy = getAppCopy(language).navigation;

  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: navigationCopy.homeTab,
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
          title: navigationCopy.optionsTab,
        }}
      />
    </Tabs>
  );
}
