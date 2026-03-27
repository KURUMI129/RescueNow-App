export type AuthThemeColors = {
  background: string;
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
};

// Opción 1 "Carmesí Neón" (Modo Oscuro Vibrante)
const darkTheme: AuthThemeColors = {
  background: "#171717",
  surface: "#262626",
  cardBorder: "rgba(255, 255, 255, 0.1)",
  textPrimary: "#FFFFFF",
  textSecondary: "#A3A3A3",
  primary: "#FF1E47",
  onPrimary: "#FFFFFF",
  inputBackground: "rgba(0, 0, 0, 0.3)",
  inputBorder: "rgba(255, 255, 255, 0.15)",
  inputPlaceholder: "#737373",
  roleIconBackground: "#404040",
  roleIconSelectedBackground: "#FF1E47",
  iconBadgeBackground: "rgba(255, 30, 71, 0.2)",
  danger: "#EF4444",
  accent: "#FFB800",
};

// Opción 3 "Alerta Inmediata" (Modo Claro Vibrante)
const lightTheme: AuthThemeColors = {
  background: "#FAFAFA",
  surface: "#FFFFFF",
  cardBorder: "rgba(0, 0, 0, 0.08)",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  primary: "#E10032",
  onPrimary: "#FFFFFF",
  inputBackground: "#F1F5F9",
  inputBorder: "rgba(0, 0, 0, 0.1)",
  inputPlaceholder: "#94A3B8",
  roleIconBackground: "#E2E8F0",
  roleIconSelectedBackground: "#E10032",
  iconBadgeBackground: "rgba(225, 0, 50, 0.15)",
  danger: "#DC2626",
  accent: "#FFB800",
};

export const AUTH_THEME_COLORS: Record<"light" | "dark", AuthThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
};
