export type HomeThemeColors = {
  background: string;
  surface: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  accent: string;
  danger: string;
  tracking: string;
  success: string;
  onPrimary: string;
  mapBackground: string;
  mapGrid: string;
  userPin: string;
  technicianPin: string;
};

export const HOME_THEME_COLORS: Record<"light" | "dark", HomeThemeColors> = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    cardBorder: "#C9D6E8",
    textPrimary: "#1F242B",
    textSecondary: "#465568",
    primary: "#0047AB",
    accent: "#FF6600",
    danger: "#E11D48",
    tracking: "#00CED1",
    success: "#34A853",
    onPrimary: "#FFFFFF",
    mapBackground: "#EAF2FF",
    mapGrid: "#C8DCF7",
    userPin: "#0047AB",
    technicianPin: "#FF6600",
  },
  dark: {
    background: "#121212",
    surface: "#1E1E1E",
    cardBorder: "#2F2F2F",
    textPrimary: "#F5F5F5",
    textSecondary: "#BDBDBD",
    primary: "#EAB308",
    accent: "#EAB308",
    danger: "#DC2626",
    tracking: "#22D3EE",
    success: "#16A34A",
    onPrimary: "#121212",
    mapBackground: "#151515",
    mapGrid: "#2A2A2A",
    userPin: "#EAB308",
    technicianPin: "#F97316",
  },
};
