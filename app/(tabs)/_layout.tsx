import { getAppCopy } from "@/constants/app-copy";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Redirect, Tabs, useRouter } from "expo-router";

import { DynamicToast } from "@/components/ui/dynamic-toast";
import { getAppPreferences } from "@/constants/app-preferences";
import { useEffect, useState } from "react";

export default function TabLayout() {
  const router = useRouter();
  const { isAuthLoading, isAuthenticated } = useAuthSession();
  const language = useAppLanguage();
  const navigationCopy = getAppCopy(language).navigation;

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const checkInfo = async () => {
      const prefs = await getAppPreferences();
      // Mostramos la tostada constantemente si no hay teléfono guardado
      if (!prefs.trustedContactPhone || prefs.trustedContactPhone.trim().length === 0) {
        setShowToast(true);
      }
    };

    // Primera revisión a los 8 segundos
    const initialTimeout = setTimeout(() => {
      void checkInfo();
    }, 8000);

    // Intervalo infinito cada 40 segundos (Demo Exclusiva)
    const interval = setInterval(() => {
      void checkInfo();
    }, 40000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated) {
    // => BYPASS TEMPORAL: Impide rebote hacia el login en fase de diseño
    // return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
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
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="medical-id"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            href: null,
            title: "RescueAI",
          }}
        />
      </Tabs>
      
      {/* Tostada IN-APP (Respaldo para Expo Go) */}
      <DynamicToast
        visible={showToast}
        title={language === "es" ? "Recordatorio de Seguridad" : "Security Reminder"}
        message={
          language === "es"
            ? "Tus datos vitales y contacto de emergencia no están configurados. Toca aquí para agregarlos."
            : "Your vital info and emergency contact are missing. Tap here to set them up."
        }
        onPress={() => {
          setShowToast(false);
          router.push("/(tabs)/options");
        }}
        onHide={() => setShowToast(false)}
        duration={6000}
      />
    </>
  );
}
