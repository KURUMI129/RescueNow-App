export type AuthThemeColors = {
  background: string;
  gradientBg: readonly [string, string];
  surface: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  roleIconBackground: string;
  roleIconSelectedBackground: string;
  iconBadgeBackground: string;
  danger: string;
  accent: string;
  success: string;
};

// Opción "Rescue Premium" (Modo Oscuro Pizarra/Navy)
const darkTheme: AuthThemeColors = {
  background: "#080C16", // Deep space navy/black
  gradientBg: ["#0B1120", "#040608"], // Top to bottom gradient
  surface: "rgba(17, 24, 39, 0.45)", // ultra translucid slate for blur
  cardBorder: "rgba(255, 255, 255, 0.08)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  primary: "#E11D48", // Neon Crimson
  onPrimary: "#FFFFFF",
  inputBackground: "rgba(15, 23, 42, 0.6)",
  inputBorder: "rgba(255, 255, 255, 0.1)",
  inputPlaceholder: "#64748B",
  roleIconBackground: "#334155",
  roleIconSelectedBackground: "#E11D48",
  iconBadgeBackground: "rgba(225, 29, 72, 0.15)",
  danger: "#EF4444",
  accent: "#0EA5E9", // Medical Blue
  success: "#10B981",
};

// Opción "Clínica Limpia" (Modo Claro Premium)
const lightTheme: AuthThemeColors = {
  background: "#F8FAFC", // Clean slate 50
  gradientBg: ["#FFFFFF", "#F1F5F9"],
  surface: "rgba(255, 255, 255, 0.5)", // Frosted glass support
  cardBorder: "rgba(15, 23, 42, 0.06)",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  primary: "#E11D48",
  onPrimary: "#FFFFFF",
  inputBackground: "#F1F5F9",
  inputBorder: "rgba(15, 23, 42, 0.1)",
  inputPlaceholder: "#94A3B8",
  roleIconBackground: "#E2E8F0",
  roleIconSelectedBackground: "#E11D48",
  iconBadgeBackground: "rgba(225, 29, 72, 0.1)",
  danger: "#DC2626",
  accent: "#0EA5E9",
  success: "#059669",
};

export const AUTH_THEME_COLORS: Record<"light" | "dark", AuthThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
};
