import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppLanguage = "es" | "en";
export type SubscriptionPlan = "free" | "premium";
export type AccountRole = "user" | "technician";
export type ThemeMode = "system" | "time" | "light" | "dark";

export type AppPreferences = {
  language: AppLanguage;
  trustedContactName: string;
  trustedContactCountryCode: string;
  trustedContactPhone: string;
  trustedContactRelationship: string;
  useTrustedContact: boolean;
  subscriptionPlan: SubscriptionPlan;
  accountRole: AccountRole;
  themeMode: ThemeMode;
  hasPromptedTheme: boolean;
  hasPromptedContact: boolean;
  bloodType: string;
  allergies: string;
  medicalConditions: string;
};

const APP_PREFERENCES_KEY = "@rescuenow/app-preferences";
const preferenceListeners = new Set<(preferences: AppPreferences) => void>();

const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: "es",
  trustedContactName: "",
  trustedContactCountryCode: "+52",
  trustedContactPhone: "",
  trustedContactRelationship: "Amigo/a",
  useTrustedContact: false,
  subscriptionPlan: "free",
  accountRole: "user",
  themeMode: "time",
  hasPromptedTheme: false,
  hasPromptedContact: false,
  bloodType: "",
  allergies: "",
  medicalConditions: "",
};

let inMemoryPreferences: AppPreferences = DEFAULT_APP_PREFERENCES;
let isPersistentStorageAvailable = true;

// Solo extrae dígitos
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "").trim();
}

// Formateador universal exportable
export function formatPhoneNumber(
  countryCode: string | undefined, 
  phone: string | undefined
): string {
  const code = countryCode?.trim() || "+52";
  const num = phone?.trim() || "";
  
  if (!num) return "No configurado";

  // Si tiene 10 dígitos (ej. 452 123 4567), se formatea (452) 123-4567
  const cleaned = num.replace(/\D/g, "");
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${code} (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  return `${code} ${num}`;
}

function sanitizePreferences(
  rawPreferences?: Partial<AppPreferences> | null,
): AppPreferences {
  const language = rawPreferences?.language === "en" ? "en" : "es";
  const subscriptionPlan =
    rawPreferences?.subscriptionPlan === "premium" ? "premium" : "free";
  const accountRole =
    rawPreferences?.accountRole === "technician" ? "technician" : "user";
  
  const trustedContactCountryCode = rawPreferences?.trustedContactCountryCode ?? "+52";
  const trustedContactPhone = normalizePhone(
    rawPreferences?.trustedContactPhone ?? "",
  );
  const useTrustedContact = Boolean(
    rawPreferences?.useTrustedContact && trustedContactPhone.length >= 7,
  );
  
  const rawThemeMode = rawPreferences?.themeMode;
  const themeMode: ThemeMode = 
    rawThemeMode === "light" || rawThemeMode === "dark" || rawThemeMode === "system"
      ? rawThemeMode
      : "time";

  const hasPromptedTheme = Boolean(rawPreferences?.hasPromptedTheme);
  const hasPromptedContact = Boolean(rawPreferences?.hasPromptedContact);
  const trustedContactName = rawPreferences?.trustedContactName ?? "";
  const trustedContactRelationship = rawPreferences?.trustedContactRelationship ?? "Amigo/a";
  const bloodType = rawPreferences?.bloodType ?? "";
  const allergies = rawPreferences?.allergies ?? "";
  const medicalConditions = rawPreferences?.medicalConditions ?? "";

  return {
    language,
    subscriptionPlan,
    accountRole,
    trustedContactCountryCode,
    trustedContactPhone,
    useTrustedContact,
    themeMode,
    hasPromptedTheme,
    hasPromptedContact,
    trustedContactName,
    trustedContactRelationship,
    bloodType,
    allergies,
    medicalConditions,
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
