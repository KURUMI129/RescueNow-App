export type AuthThemeColors = {
  background: string;
  surface: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  primary: string;
  primaryDisabled: string;
  onPrimary: string;
  roleCardBackground: string;
  roleCardBorder: string;
  roleCardSelectedBackground: string;
  roleIconBackground: string;
  roleIconSelectedBackground: string;
  iconBadgeBackground: string;
};

export const AUTH_THEME_COLORS: Record<"light" | "dark", AuthThemeColors> = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    cardBorder: "#C9D6E8",
    textPrimary: "#1F242B",
    textSecondary: "#465568",
    inputBackground: "#F5F9FF",
    inputBorder: "#C9D6E8",
    inputPlaceholder: "#6E829F",
    primary: "#0047AB",
    primaryDisabled: "#8BAFDA",
    onPrimary: "#FFFFFF",
    roleCardBackground: "#FFFFFF",
    roleCardBorder: "#D8E2F0",
    roleCardSelectedBackground: "#EAF2FF",
    roleIconBackground: "#DDEBFF",
    roleIconSelectedBackground: "#0047AB",
    iconBadgeBackground: "#EAF2FF",
  },
  dark: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    cardBorder: "#C9D6E8",
    textPrimary: "#1F242B",
    textSecondary: "#465568",
    inputBackground: "#F5F9FF",
    inputBorder: "#C9D6E8",
    inputPlaceholder: "#6E829F",
    primary: "#0047AB",
    primaryDisabled: "#8BAFDA",
    onPrimary: "#FFFFFF",
    roleCardBackground: "#FFFFFF",
    roleCardBorder: "#D8E2F0",
    roleCardSelectedBackground: "#EAF2FF",
    roleIconBackground: "#DDEBFF",
    roleIconSelectedBackground: "#0047AB",
    iconBadgeBackground: "#EAF2FF",
  },
};
