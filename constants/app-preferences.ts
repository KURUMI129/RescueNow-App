import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppLanguage = "es" | "en";
export type SubscriptionPlan = "free" | "premium";
export type AccountRole = "user" | "technician";
import { SOSSoundOption } from "./sos-settings";

export type ThemeMode = "system" | "time" | "light" | "dark";

export type IncidentType = "manual" | "crash_detection";
export type IncidentMessageMethod = "whatsapp" | "sms" | "failed" | "no_contact";

export type Incident = {
  id: string;
  timestamp: number;
  type: IncidentType;
  location: {
    latitude: number;
    longitude: number;
  };
  messageMethod: IncidentMessageMethod;
};

// Maximum incidents stored locally (always keep latest)
const MAX_STORED_INCIDENTS = 50;

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
  sosSound: SOSSoundOption;
  sosVibration: boolean;

  // ===== Premium: Modo Viaje =====
  travelModeActive: boolean;
  travelModeStartTime: number | null; // epoch ms
  travelModeDurationHours: 1 | 2 | 4 | 8;
  travelModeDestination: string; // texto libre opcional

  // ===== Premium: Check-in Diario =====
  checkInEnabled: boolean;
  checkInScheduleHour: number; // 0-23
  checkInScheduleMinute: number; // 0-59
  lastCheckInTime: number | null; // epoch ms
  checkInStreak: number; // días consecutivos

  // ===== Historial de emergencias (FREE ve 5, PREMIUM ve todo) =====
  incidents: Incident[];
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
  sosSound: "default",
  sosVibration: true,
  travelModeActive: false,
  travelModeStartTime: null,
  travelModeDurationHours: 2,
  travelModeDestination: "",
  checkInEnabled: false,
  checkInScheduleHour: 9,
  checkInScheduleMinute: 0,
  lastCheckInTime: null,
  checkInStreak: 0,
  incidents: [],
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

  const rawSosSound = rawPreferences?.sosSound;
  const sosSound: SOSSoundOption =
    rawSosSound === "alarm" || rawSosSound === "siren" || rawSosSound === "silent"
      ? rawSosSound
      : "default";
  const sosVibration = rawPreferences?.sosVibration !== undefined ? rawPreferences.sosVibration : true;

  // Travel mode (Premium)
  const travelModeActive = Boolean(rawPreferences?.travelModeActive);
  const travelModeStartTime =
    typeof rawPreferences?.travelModeStartTime === "number"
      ? rawPreferences.travelModeStartTime
      : null;
  const rawDuration = rawPreferences?.travelModeDurationHours;
  const travelModeDurationHours: 1 | 2 | 4 | 8 =
    rawDuration === 1 || rawDuration === 2 || rawDuration === 4 || rawDuration === 8
      ? rawDuration
      : 2;
  const travelModeDestination = rawPreferences?.travelModeDestination ?? "";

  // Check-in (Premium)
  const checkInEnabled = Boolean(rawPreferences?.checkInEnabled);
  const rawHour = rawPreferences?.checkInScheduleHour;
  const checkInScheduleHour =
    typeof rawHour === "number" && rawHour >= 0 && rawHour <= 23
      ? Math.floor(rawHour)
      : 9;
  const rawMinute = rawPreferences?.checkInScheduleMinute;
  const checkInScheduleMinute =
    typeof rawMinute === "number" && rawMinute >= 0 && rawMinute <= 59
      ? Math.floor(rawMinute)
      : 0;
  const lastCheckInTime =
    typeof rawPreferences?.lastCheckInTime === "number"
      ? rawPreferences.lastCheckInTime
      : null;
  const rawStreak = rawPreferences?.checkInStreak;
  const checkInStreak =
    typeof rawStreak === "number" && rawStreak >= 0 ? Math.floor(rawStreak) : 0;

  // Incidents — sanitize each entry, keep newest first, cap to MAX_STORED_INCIDENTS
  const rawIncidents = Array.isArray(rawPreferences?.incidents)
    ? rawPreferences!.incidents
    : [];
  const incidents: Incident[] = rawIncidents
    .filter((it): it is Incident => {
      return (
        !!it &&
        typeof it.id === "string" &&
        typeof it.timestamp === "number" &&
        (it.type === "manual" || it.type === "crash_detection") &&
        !!it.location &&
        typeof it.location.latitude === "number" &&
        typeof it.location.longitude === "number"
      );
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_STORED_INCIDENTS);

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
    sosSound,
    sosVibration,
    travelModeActive,
    travelModeStartTime,
    travelModeDurationHours,
    travelModeDestination,
    checkInEnabled,
    checkInScheduleHour,
    checkInScheduleMinute,
    lastCheckInTime,
    checkInStreak,
    incidents,
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

// =============== INCIDENTS HELPER ===============
/**
 * Append a new incident to the local history. Keeps the most recent
 * MAX_STORED_INCIDENTS entries and always sorted newest-first.
 */
export async function recordIncident(
  incident: Omit<Incident, "id">,
): Promise<AppPreferences> {
  const current = await getAppPreferences();
  const newEntry: Incident = {
    id: `inc_${incident.timestamp}_${Math.random().toString(36).slice(2, 8)}`,
    ...incident,
  };
  const nextIncidents = [newEntry, ...current.incidents].slice(0, MAX_STORED_INCIDENTS);
  return updateAppPreferences({ incidents: nextIncidents });
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
