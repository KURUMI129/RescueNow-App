import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppLanguage = "es" | "en";

export type AppPreferences = {
  language: AppLanguage;
  trustedContactPhone: string;
  useTrustedContact: boolean;
};

const APP_PREFERENCES_KEY = "@rescuenow/app-preferences";
const preferenceListeners = new Set<(preferences: AppPreferences) => void>();

const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: "es",
  trustedContactPhone: "",
  useTrustedContact: false,
};

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}

function sanitizePreferences(
  rawPreferences?: Partial<AppPreferences> | null,
): AppPreferences {
  const language = rawPreferences?.language === "en" ? "en" : "es";
  const trustedContactPhone = normalizePhone(
    rawPreferences?.trustedContactPhone ?? "",
  );
  const useTrustedContact = Boolean(
    rawPreferences?.useTrustedContact && trustedContactPhone.length >= 7,
  );

  return {
    language,
    trustedContactPhone,
    useTrustedContact,
  };
}

export async function getAppPreferences(): Promise<AppPreferences> {
  try {
    const rawStoredValue = await AsyncStorage.getItem(APP_PREFERENCES_KEY);
    if (!rawStoredValue) {
      return DEFAULT_APP_PREFERENCES;
    }

    const parsedValue = JSON.parse(rawStoredValue) as Partial<AppPreferences>;
    return sanitizePreferences(parsedValue);
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export async function updateAppPreferences(
  partialPreferences: Partial<AppPreferences>,
): Promise<AppPreferences> {
  const currentPreferences = await getAppPreferences();
  const nextPreferences = sanitizePreferences({
    ...currentPreferences,
    ...partialPreferences,
  });

  await AsyncStorage.setItem(
    APP_PREFERENCES_KEY,
    JSON.stringify(nextPreferences),
  );

  preferenceListeners.forEach((listener) => {
    listener(nextPreferences);
  });

  return nextPreferences;
}

export function subscribeToAppPreferences(
  listener: (preferences: AppPreferences) => void,
) {
  preferenceListeners.add(listener);

  return () => {
    preferenceListeners.delete(listener);
  };
}

export { DEFAULT_APP_PREFERENCES };
