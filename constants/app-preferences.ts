import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppLanguage = "es" | "en";
export type SubscriptionPlan = "free" | "premium";
export type AccountRole = "user" | "technician";

export type AppPreferences = {
  language: AppLanguage;
  trustedContactPhone: string;
  useTrustedContact: boolean;
  subscriptionPlan: SubscriptionPlan;
  accountRole: AccountRole;
};

const APP_PREFERENCES_KEY = "@rescuenow/app-preferences";
const preferenceListeners = new Set<(preferences: AppPreferences) => void>();

const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: "es",
  trustedContactPhone: "",
  useTrustedContact: false,
  subscriptionPlan: "free",
  accountRole: "user",
};

let inMemoryPreferences: AppPreferences = DEFAULT_APP_PREFERENCES;
let isPersistentStorageAvailable = true;

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}

function sanitizePreferences(
  rawPreferences?: Partial<AppPreferences> | null,
): AppPreferences {
  const language = rawPreferences?.language === "en" ? "en" : "es";
  const subscriptionPlan =
    rawPreferences?.subscriptionPlan === "premium" ? "premium" : "free";
  const accountRole =
    rawPreferences?.accountRole === "technician" ? "technician" : "user";
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
    subscriptionPlan,
    accountRole,
  };
}

export async function getAppPreferences(): Promise<AppPreferences> {
  if (!isPersistentStorageAvailable) {
    return inMemoryPreferences;
  }

  try {
    const rawStoredValue = await AsyncStorage.getItem(APP_PREFERENCES_KEY);
    isPersistentStorageAvailable = true;

    if (!rawStoredValue) {
      return inMemoryPreferences;
    }

    const parsedValue = JSON.parse(rawStoredValue) as Partial<AppPreferences>;
    const sanitized = sanitizePreferences(parsedValue);
    inMemoryPreferences = sanitized;
    return sanitized;
  } catch {
    isPersistentStorageAvailable = false;
    return inMemoryPreferences;
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

  inMemoryPreferences = nextPreferences;

  if (!isPersistentStorageAvailable) {
    preferenceListeners.forEach((listener) => {
      listener(nextPreferences);
    });

    return nextPreferences;
  }

  try {
    await AsyncStorage.setItem(
      APP_PREFERENCES_KEY,
      JSON.stringify(nextPreferences),
    );
    isPersistentStorageAvailable = true;
  } catch {
    isPersistentStorageAvailable = false;
    // Keep in-memory preferences when native storage is unavailable.
  }

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

export function appPreferencesStorageAvailable() {
  return isPersistentStorageAvailable;
}

export { DEFAULT_APP_PREFERENCES };
