export interface CrashSensitivitySettings {
  enabled: boolean;
  threshold: number;
  delaySeconds: number;
}

export const DEFAULT_CRASH_SENSITIVITY: CrashSensitivitySettings = {
  enabled: true,
  threshold: 5,
  delaySeconds: 30,
};

export const CRASH_SENSITIVITY_LABELS: Record<number, string> = {
  1: "Suave",
  2: "Suave",
  3: "Suave",
  4: "Suave",
  5: "Normal",
  6: "Normal",
  7: "Sensible",
  8: "Sensible",
  9: "Sensible",
  10: "Sensible",
};