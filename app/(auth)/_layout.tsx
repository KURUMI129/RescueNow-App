import { useAuthSession } from "@/hooks/use-auth-session";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function AuthLayout() {
  const { isAuthLoading, isAuthenticated } = useAuthSession();
  const [splashDone, setSplashDone] = useState(false);

  // Always show splash for 3 seconds before any redirect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isAuthLoading || !splashDone) {
    // Show the splash/index screen while loading
    return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
    </Stack>
  );
}
