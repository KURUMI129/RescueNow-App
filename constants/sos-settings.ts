export type SOSSoundOption = "default" | "alarm" | "siren" | "silent";

export interface SOSSettings {
  sound: SOSSoundOption;
  vibration: boolean;
}

export interface SOSSoundOptionItem {
  id: SOSSoundOption;
  label: string;
  icon: string;
}

export const SOS_SOUND_OPTIONS: SOSSoundOptionItem[] = [
  { id: "default", label: "Predeterminado", icon: "volume-high" },
  { id: "alarm", label: "Alarma", icon: "alert-circle" },
  { id: "siren", label: "Sirena", icon: "police-car" },
  { id: "silent", label: "Silencioso", icon: "volume-off" },
];

export const DEFAULT_SOS_SETTINGS: SOSSettings = {
  sound: "default",
  vibration: true,
};