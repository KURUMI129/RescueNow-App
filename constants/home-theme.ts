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
    cardBorder: "#D8E2F0",
    textPrimary: "#333333",
    textSecondary: "#5E6B7A",
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
    background: "#06152B",
    surface: "#0B2345",
    cardBorder: "#1B3B66",
    textPrimary: "#EAF2FF",
    textSecondary: "#AFC2DB",
    primary: "#2C7BFF",
    accent: "#FF8A34",
    danger: "#FF4D73",
    tracking: "#2DE4E9",
    success: "#52D071",
    onPrimary: "#FFFFFF",
    mapBackground: "#102F5A",
    mapGrid: "#244875",
    userPin: "#2C7BFF",
    technicianPin: "#FF8A34",
  },
};
