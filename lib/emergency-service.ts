import * as SMS from "expo-sms";
import * as Location from "expo-location";
import { Linking } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { withRetry } from "./api-retry";
import { firestoreDb } from "./firebase";

type EmergencyLocation = {
  latitude: number;
  longitude: number;
};

type MedicalData = {
  bloodType: string;
  allergies: string;
  medicalConditions: string;
};

/**
 * Build the emergency message body (shared between WhatsApp and SMS).
 * Kept short and simple — only essential info for the contact.
 * Medical data is NOT included here (it goes to the 911 call and the on-screen ficha).
 */
function buildEmergencyMessage(
  userName: string,
  location: EmergencyLocation,
): string {
  const mapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

  return [
    `🚨 EMERGENCIA – RescueNow`,
    ``,
    `${userName} tuvo un accidente y necesita ayuda urgente.`,
    ``,
    `📍 Ubicación exacta:`,
    `${mapsLink}`,
    ``,
    `Por favor acuda a la ubicación o llame al 911.`,
    `— RescueNow`,
  ].join("\n");
}

/**
 * Build a WhatsApp-compatible phone number using the explicit country code
 * stored in the user's preferences. Falls back to legacy "+52 if 10 digits"
 * behavior only when no countryCode is supplied.
 */
export function buildInternationalPhone(
  contactPhone: string,
  countryCode?: string,
): string {
  const cleanPhone = contactPhone.replace(/[^0-9]/g, "");

  // If contactPhone already starts with country code digits (no +), keep it
  if (countryCode) {
    const cleanCode = countryCode.replace(/[^0-9]/g, "");
    // Avoid double-prefixing if the user typed the code into the phone field
    if (cleanPhone.startsWith(cleanCode)) {
      return cleanPhone;
    }
    return `${cleanCode}${cleanPhone}`;
  }

  // Legacy fallback — assume Mexico (+52) if 10 digits and no code provided
  return cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
}

/**
 * Send emergency message via WhatsApp (requires internet).
 * Opens WhatsApp with the pre-filled message to the contact's number.
 * Returns true if WhatsApp was opened successfully.
 */
async function sendEmergencyWhatsApp(
  contactPhone: string,
  message: string,
  countryCode?: string,
): Promise<boolean> {
  try {
    const formattedPhone = buildInternationalPhone(contactPhone, countryCode);

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return true;
    }

    // Try the direct whatsapp:// scheme as fallback
    const directUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
    const canOpenDirect = await Linking.canOpenURL(directUrl);
    if (canOpenDirect) {
      await Linking.openURL(directUrl);
      return true;
    }

    console.warn("[Emergency] WhatsApp not installed or cannot open");
    return false;
  } catch (e) {
    console.error("[Emergency] Error opening WhatsApp:", e);
    return false;
  }
}

/**
 * Send emergency SMS via native SMS app (works WITHOUT internet).
 * Only needs cellular signal.
 */
async function sendEmergencySMSNative(
  contactPhone: string,
  message: string,
): Promise<boolean> {
  try {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      console.warn("[Emergency] SMS is not available on this device");
      return false;
    }

    const { result } = await SMS.sendSMSAsync([contactPhone], message);
    return result === "sent" || result === "unknown"; // "unknown" on Android = opened
  } catch (e) {
    console.error("[Emergency] Error sending SMS:", e);
    return false;
  }
}

/**
 * Smart emergency message sender:
 *   - With internet → WhatsApp (preferred)
 *   - Without internet (or WhatsApp fails) → SMS (offline fallback)
 *   
 * Works in BOTH online and offline scenarios.
 */
export async function sendEmergencyMessage(
  contactPhone: string,
  _contactName: string,
  location: EmergencyLocation,
  userName: string,
  countryCode?: string,
): Promise<{ method: "whatsapp" | "sms" | "failed"; success: boolean }> {
  const message = buildEmergencyMessage(userName, location);

  // Validate phone — at least 7 digits is required
  const cleanPhone = contactPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length < 7) {
    console.warn("[Emergency] Invalid contact phone:", contactPhone);
    return { method: "failed", success: false };
  }

  // Check network connectivity
  let isConnected = false;
  try {
    const netState = await NetInfo.fetch();
    isConnected = !!(netState.isConnected && netState.isInternetReachable);
  } catch {
    // Can't check network — assume offline
    isConnected = false;
  }

  // Online → try WhatsApp first
  if (isConnected) {
    const whatsappSent = await sendEmergencyWhatsApp(contactPhone, message, countryCode);
    if (whatsappSent) {
      return { method: "whatsapp", success: true };
    }
    // WhatsApp failed (not installed?) → fall through to SMS
  }

  // Offline or WhatsApp failed → use SMS (uses native dialer with country code if provided)
  const smsRecipient = countryCode
    ? `${countryCode}${cleanPhone}`
    : contactPhone;
  const smsSent = await sendEmergencySMSNative(smsRecipient, message);
  if (smsSent) {
    return { method: "sms", success: true };
  }

  return { method: "failed", success: false };
}

// Keep the old export name for backward compatibility
export const sendEmergencySMS = async (
  contactPhone: string,
  _contactName: string,
  location: EmergencyLocation,
  userName: string,
  countryCode?: string,
): Promise<boolean> => {
  const result = await sendEmergencyMessage(contactPhone, _contactName, location, userName, countryCode);
  return result.success;
};

/**
 * Save incident to Firestore (with offline support — syncs when back online).
 */
export async function saveIncident(
  userId: string,
  location: EmergencyLocation,
  triggerType: "manual" | "crash_detection",
  medicalData: MedicalData,
  contactPhone?: string,
): Promise<string | null> {
  const saveToFirestore = async () => {
    const docRef = await addDoc(collection(firestoreDb, "incidents"), {
      userId,
      latitude: location.latitude,
      longitude: location.longitude,
      triggerType,
      serviceType: "accident",
      smsSent: !!contactPhone,
      contactNotified: contactPhone ?? "",
      bloodType: medicalData.bloodType,
      allergies: medicalData.allergies,
      medicalConditions: medicalData.medicalConditions,
      status: "active",
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  };

  try {
    return await withRetry(saveToFirestore, {
      maxRetries: 3,
      baseDelayMs: 1000,
      // Retry on network errors
      shouldRetry: (error: any) => {
        // Firestore errors often have a code property
        return error.code === 'unavailable' || 
               error.code === 'deadline-exceeded' || 
               error.message?.includes('network') ||
               !error.code; // Generic errors
      }
    });
  } catch (e) {
    console.error("Error saving incident:", e);
    return null;
  }
}

export type ResolvedAddress = {
  spoken: string;   // human-friendly string read aloud by TTS
  display: string;  // pretty multi-line for the medical card
};

/**
 * Reverse-geocode coordinates into a real street address.
 * Uses expo-location's native reverseGeocodeAsync (Apple/Google Geocoder),
 * which requires foreground location permission (already granted by SOS flow).
 *
 * Returns null if the lookup fails or the device is offline — callers must
 * fall back to plain coordinates.
 */
export async function reverseGeocodeLocation(
  location: EmergencyLocation,
): Promise<ResolvedAddress | null> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    const first = results[0];
    if (!first) return null;

    // Build the parts of a real-world address. Different platforms populate
    // different fields, so we filter falsy values and join.
    const street = first.street ?? "";
    const number = first.streetNumber ?? "";
    const streetLine = [street, number].filter(Boolean).join(" ").trim();

    const district = first.district ?? first.subregion ?? "";
    const city = first.city ?? first.region ?? "";
    const postal = first.postalCode ?? "";

    const spokenParts = [
      streetLine && `en ${streetLine}`,
      district && `colonia ${district}`,
      city,
    ].filter(Boolean) as string[];

    const displayParts = [
      streetLine,
      district,
      [city, postal].filter(Boolean).join(", "),
    ].filter(Boolean) as string[];

    if (spokenParts.length === 0) return null;

    return {
      spoken: spokenParts.join(", "),
      display: displayParts.join("\n"),
    };
  } catch (e) {
    console.warn("[Emergency] reverseGeocode failed:", e);
    return null;
  }
}

/**
 * Generate the voice script for the simulated 911 call.
 * Used by expo-speech (TTS) — works 100% offline.
 *
 * If a resolved address is provided, the script speaks the street name like a
 * real emergency call. Otherwise it falls back to coordinates.
 */
export function get911VoiceScript(
  userName: string,
  location: EmergencyLocation,
  medicalData: MedicalData,
  address?: ResolvedAddress | null,
): string {
  const locationPhrase = address?.spoken
    ? `La ubicación es ${address.spoken}.`
    : `La ubicación es latitud ${location.latitude.toFixed(4)}, longitud ${location.longitude.toFixed(4)}.`;

  const blood = medicalData.bloodType || "desconocido";
  const allergies = medicalData.allergies || "sin alergias registradas";
  const conditions = medicalData.medicalConditions || "sin condiciones registradas";

  return [
    `Habla el sistema de emergencia RescueNow.`,
    `Se reporta un accidente vehicular.`,
    locationPhrase,
    `El paciente se llama ${userName}.`,
    `Tipo de sangre ${blood}, con alergias a ${allergies}.`,
    `Condiciones médicas: ${conditions}.`,
    `El paciente posiblemente no puede hablar en este momento.`,
    `Se requiere ambulancia de inmediato.`,
    `Repito, se requiere ambulancia de inmediato en la ubicación indicada.`,
  ].join(" ");
}
