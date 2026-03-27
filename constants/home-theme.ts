export type HomeThemeColors = {
  background: string;
  surface: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  tabIconDefault: string;
  tabIconSelected: string;
  rippleColor: string;
  danger: string;
  accent: string;
  mapBackground: string;
  tracking: string;
  userPin: string;
  technicianPin: string;
  mapGrid: string;
  success: string;
};

// Opción 1 "Carmesí Neón" (Modo Oscuro Vibrante)
const darkTheme: HomeThemeColors = {
  background: "#171717",
  surface: "rgba(38, 38, 38, 0.8)", // Frosted glass support
  cardBorder: "rgba(255, 255, 255, 0.1)",
  textPrimary: "#FFFFFF",
  textSecondary: "#A3A3A3",
  primary: "#FF1E47",
  onPrimary: "#FFFFFF",
  tabIconDefault: "#737373",
  tabIconSelected: "#FF1E47",
  rippleColor: "rgba(255, 30, 71, 0.2)",
  danger: "#EF4444",
  accent: "#FFB800",
  mapBackground: "#171717",
  tracking: "#FF1E47",
  userPin: "#3B82F6",
  technicianPin: "#FFB800",
  mapGrid: "rgba(255, 255, 255, 0.03)",
  success: "#10B981",
};

// Opción 3 "Alerta Inmediata" (Modo Claro Vibrante)
const lightTheme: HomeThemeColors = {
  background: "#FAFAFA",
  surface: "rgba(255, 255, 255, 0.85)", // Frosted glass support
  cardBorder: "rgba(0, 0, 0, 0.08)",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  primary: "#E10032",
  onPrimary: "#FFFFFF",
  tabIconDefault: "#94A3B8",
  tabIconSelected: "#E10032",
  rippleColor: "rgba(225, 0, 50, 0.15)",
  danger: "#DC2626",
  accent: "#FFB800", // Yellow
  mapBackground: "#FAFAFA",
  tracking: "#E10032",
  userPin: "#2563EB",
  technicianPin: "#FFB800",
  mapGrid: "rgba(0, 0, 0, 0.05)",
  success: "#10B981",
};

export const HOME_THEME_COLORS: Record<"light" | "dark", HomeThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
};
