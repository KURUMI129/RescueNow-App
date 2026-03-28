import { useAuthSession } from "@/hooks/use-auth-session";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isAuthLoading, isAuthenticated } = useAuthSession();

  if (isAuthLoading) {
    return null;
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
