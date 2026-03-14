import type { AppLanguage } from "@/constants/app-preferences";

function getLocale(language: AppLanguage) {
  return language === "en" ? "en-MX" : "es-MX";
}

export function formatDistanceKm(distanceKm: number, language: AppLanguage) {
  const numberLabel = new Intl.NumberFormat(getLocale(language), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(distanceKm);

  return `${numberLabel} km`;
}

export function formatCurrencyMxn(amount: number, language: AppLanguage) {
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEtaMinutes(minutes: number, language: AppLanguage) {
  const numberLabel = new Intl.NumberFormat(getLocale(language), {
    maximumFractionDigits: 0,
  }).format(minutes);

  return `${numberLabel} min`;
}
