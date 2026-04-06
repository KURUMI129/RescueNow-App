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

// Opción "Rescue Premium" (Modo Oscuro Pizarra/Navy)
const darkTheme: HomeThemeColors = {
  background: "#0B1120", // Deep navy
  surface: "rgba(30, 41, 59, 0.8)", // Slate 800 frosted glass support
  cardBorder: "rgba(255, 255, 255, 0.08)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  primary: "#E11D48", // Neon Crimson
  onPrimary: "#FFFFFF",
  tabIconDefault: "#64748B",
  tabIconSelected: "#E11D48",
  rippleColor: "rgba(225, 29, 72, 0.2)",
  danger: "#EF4444",
  accent: "#0EA5E9", // Medical Blue
  mapBackground: "#0B1120",
  tracking: "#E11D48",
  userPin: "#0EA5E9",
  technicianPin: "#F59E0B",
  mapGrid: "rgba(255, 255, 255, 0.03)",
  success: "#10B981",
};

// Opción "Clínica Limpia" (Modo Claro Premium)
const lightTheme: HomeThemeColors = {
  background: "#F8FAFC", // Clean slate 50
  surface: "rgba(255, 255, 255, 0.85)", // Frosted glass support
  cardBorder: "rgba(15, 23, 42, 0.06)",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  primary: "#E11D48",
  onPrimary: "#FFFFFF",
  tabIconDefault: "#94A3B8",
  tabIconSelected: "#E11D48",
  rippleColor: "rgba(225, 29, 72, 0.15)",
  danger: "#DC2626",
  accent: "#0EA5E9", // Medical Blue
  mapBackground: "#F8FAFC",
  tracking: "#E11D48",
  userPin: "#0EA5E9",
  technicianPin: "#F59E0B",
  mapGrid: "rgba(15, 23, 42, 0.04)",
  success: "#10B981",
};

export const HOME_THEME_COLORS: Record<"light" | "dark", HomeThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
};
