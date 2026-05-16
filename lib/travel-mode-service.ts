import * as SMS from "expo-sms";
import { Linking } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import { buildInternationalPhone } from "./emergency-service";

export type TravelLocation = {
  latitude: number;
  longitude: number;
};

export type TravelMessageResult = {
  method: "whatsapp" | "sms" | "failed";
  success: boolean;
};

// =============== MESSAGE BUILDERS ===============

export function buildTravelStartMessage(
  userName: string,
  location: TravelLocation,
  destination: string,
  durationHours: number,
  language: "es" | "en" = "es",
): string {
  const mapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

  if (language === "en") {
    const dest = destination.trim().length > 0 ? destination.trim() : "(not specified)";
    return [
      `🚗 RescueNow – Travel Mode started`,
      ``,
      `${userName} just started a trip.`,
      `Destination: ${dest}`,
      `Expected duration: up to ${durationHours}h`,
      ``,
      `📍 Starting point:`,
      mapsLink,
      ``,
      `If you don't hear back from ${userName} when the trip ends, please reach out or call 911.`,
      `— RescueNow`,
    ].join("\n");
  }

  const dest = destination.trim().length > 0 ? destination.trim() : "(no especificado)";
  return [
    `🚗 RescueNow – Modo Viaje iniciado`,
    ``,
    `${userName} acaba de iniciar un viaje.`,
    `Destino: ${dest}`,
    `Duración estimada: hasta ${durationHours}h`,
    ``,
    `📍 Punto de partida:`,
    mapsLink,
    ``,
    `Si no recibes confirmación de ${userName} al terminar el viaje, comunícate o llama al 911.`,
    `— RescueNow`,
  ].join("\n");
}

export function buildTravelArrivalMessage(
  userName: string,
  location: TravelLocation,
  language: "es" | "en" = "es",
): string {
  const mapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  if (language === "en") {
    return [
      `✅ RescueNow – Trip ended safely`,
      ``,
      `${userName} has arrived safely.`,
      `📍 Final location: ${mapsLink}`,
      `— RescueNow`,
    ].join("\n");
  }
  return [
    `✅ RescueNow – Viaje finalizado con seguridad`,
    ``,
    `${userName} llegó con bien.`,
    `📍 Ubicación final: ${mapsLink}`,
    `— RescueNow`,
  ].join("\n");
}

export function buildTravelOverdueMessage(
  userName: string,
  language: "es" | "en" = "es",
): string {
  if (language === "en") {
    return [
      `⚠️ RescueNow – Trip overdue`,
      ``,
      `${userName} has not confirmed arrival after the expected travel time.`,
      `Please try to reach them. If you can't, consider calling 911.`,
      `— RescueNow`,
    ].join("\n");
  }
  return [
    `⚠️ RescueNow – Viaje atrasado`,
    ``,
    `${userName} no ha confirmado su llegada después del tiempo estimado.`,
    `Intenta contactarlo. Si no responde, considera llamar al 911.`,
    `— RescueNow`,
  ].join("\n");
}

// =============== TRANSPORT (WhatsApp first, SMS fallback) ===============

async function sendViaWhatsApp(
  contactPhone: string,
  message: string,
  countryCode?: string,
): Promise<boolean> {
  try {
    const formattedPhone = buildInternationalPhone(contactPhone, countryCode);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    if (await Linking.canOpenURL(whatsappUrl)) {
      await Linking.openURL(whatsappUrl);
      return true;
    }

    const directUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
    if (await Linking.canOpenURL(directUrl)) {
      await Linking.openURL(directUrl);
      return true;
    }
    return false;
  } catch (e) {
    console.warn("[Travel] WhatsApp error:", e);
    return false;
  }
}

async function sendViaSMS(
  recipient: string,
  message: string,
): Promise<boolean> {
  try {
    const available = await SMS.isAvailableAsync();
    if (!available) return false;
    const { result } = await SMS.sendSMSAsync([recipient], message);
    return result === "sent" || result === "unknown";
  } catch (e) {
    console.warn("[Travel] SMS error:", e);
    return false;
  }
}

export async function sendTravelMessage(
  contactPhone: string,
  message: string,
  countryCode?: string,
): Promise<TravelMessageResult> {
  const cleanPhone = contactPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length < 7) {
    return { method: "failed", success: false };
  }

  let isConnected = false;
  try {
    const state = await NetInfo.fetch();
    isConnected = !!(state.isConnected && state.isInternetReachable);
  } catch {
    isConnected = false;
  }

  if (isConnected) {
    const ok = await sendViaWhatsApp(contactPhone, message, countryCode);
    if (ok) return { method: "whatsapp", success: true };
  }

  const smsRecipient = countryCode ? `${countryCode}${cleanPhone}` : contactPhone;
  const ok = await sendViaSMS(smsRecipient, message);
  return ok
    ? { method: "sms", success: true }
    : { method: "failed", success: false };
}
