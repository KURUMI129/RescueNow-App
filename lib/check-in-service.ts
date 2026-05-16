import * as Notifications from "expo-notifications";

import { sendTravelMessage } from "./travel-mode-service";

const NOTIFICATION_IDENTIFIER = "rescuenow_daily_check_in";

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

/**
 * Compute the new streak given the previous check-in timestamp.
 *  - Same calendar day: keep streak (no double-count).
 *  - Yesterday: +1.
 *  - Older or never: reset to 1.
 */
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

  if (diffDays === 0) return Math.max(previousStreak, 1); // already checked in today
  if (diffDays === 1) return previousStreak + 1;
  return 1; // streak broken
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
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}

export async function cancelCheckInNotification(): Promise<void> {
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
      } as Notifications.CalendarTriggerInput,
    });
    return true;
  } catch (e) {
    console.warn("[CheckIn] Failed to schedule notification:", e);
    return false;
  }
}
