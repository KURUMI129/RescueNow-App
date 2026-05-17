import Constants, { ExecutionEnvironment } from "expo-constants";

import { sendTravelMessage } from "./travel-mode-service";

// Expo Go (SDK 53+) removed remote push notification support. Even importing
// expo-notifications at module load prints a red error banner in Expo Go, so
// we ONLY require() the module lazily inside dev/standalone builds.
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const NOTIFICATION_IDENTIFIER = "rescuenow_daily_check_in";

type NotificationsModule = typeof import("expo-notifications");

let cachedNotifications: NotificationsModule | null = null;

function loadNotifications(): NotificationsModule | null {
  if (IS_EXPO_GO) return null;
  if (cachedNotifications) return cachedNotifications;
  try {
    // require() is intentional: keeps the import out of the static graph so
    // Metro/Expo Go does not eagerly evaluate the module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedNotifications = require("expo-notifications") as NotificationsModule;
    return cachedNotifications;
  } catch {
    return null;
  }
}

// =============== MESSAGE BUILDER ===============

export function buildCheckInMessage(
  userName: string,
  streak: number,
  language: "es" | "en" = "es",
): string {
  if (language === "en") {
    const streakLine = streak > 1 ? `\n🔥 Streak: ${streak} days` : "";
    return [
      `✅ RescueNow – Daily check-in`,
      ``,
      `${userName} just confirmed they are safe and well.${streakLine}`,
      `— RescueNow`,
    ].join("\n");
  }
  const streakLine = streak > 1 ? `\n🔥 Racha: ${streak} días` : "";
  return [
    `✅ RescueNow – Check-in diario`,
    ``,
    `${userName} acaba de confirmar que está bien.${streakLine}`,
    `— RescueNow`,
  ].join("\n");
}

// =============== STREAK LOGIC ===============

export function computeNextStreak(
  previousCheckIn: number | null,
  previousStreak: number,
  now: number = Date.now(),
): number {
  if (!previousCheckIn) return 1;

  const prev = new Date(previousCheckIn);
  const today = new Date(now);

  const prevDay = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.round((todayDay - prevDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return Math.max(previousStreak, 1);
  if (diffDays === 1) return previousStreak + 1;
  return 1;
}

// =============== SENDING TO CONTACT ===============

export async function sendCheckInToContact(
  contactPhone: string,
  contactCountryCode: string,
  userName: string,
  streak: number,
  language: "es" | "en" = "es",
): Promise<{ success: boolean; method: "whatsapp" | "sms" | "failed" }> {
  const message = buildCheckInMessage(userName, streak, language);
  return sendTravelMessage(contactPhone, message, contactCountryCode);
}

// =============== LOCAL NOTIFICATION SCHEDULING ===============

export async function requestNotificationsPermission(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

export async function cancelCheckInNotification(): Promise<void> {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
  } catch {
    // Notification may not exist; ignore
  }
}

export async function scheduleDailyCheckInNotification(
  hour: number,
  minute: number,
  language: "es" | "en" = "es",
): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) {
    console.info("[CheckIn] Skipping notification scheduling (Expo Go or missing module).");
    return false;
  }
  const allowed = await requestNotificationsPermission();
  if (!allowed) return false;

  await cancelCheckInNotification();

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDENTIFIER,
      content: {
        title: language === "es" ? "¿Cómo estás?" : "How are you?",
        body:
          language === "es"
            ? "Confirma con un toque que estás bien para mantener tu racha."
            : "Tap to confirm you're safe and keep your streak.",
        sound: "default",
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      } as any,
    });
    return true;
  } catch (e) {
    console.warn("[CheckIn] Failed to schedule notification:", e);
    return false;
  }
}
