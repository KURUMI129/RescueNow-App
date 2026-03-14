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
    cardBorder: "#D8E2F0",
    textPrimary: "#333333",
    textSecondary: "#5E6B7A",
    inputBackground: "#F5F9FF",
    inputBorder: "#D8E2F0",
    inputPlaceholder: "#8FA2BC",
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
    background: "#06152B",
    surface: "#0B2345",
    cardBorder: "#1B3B66",
    textPrimary: "#EAF2FF",
    textSecondary: "#AFC2DB",
    inputBackground: "#10305A",
    inputBorder: "#275080",
    inputPlaceholder: "#89A5C8",
    primary: "#2C7BFF",
    primaryDisabled: "#2A4D7E",
    onPrimary: "#FFFFFF",
    roleCardBackground: "#0B2345",
    roleCardBorder: "#1B3B66",
    roleCardSelectedBackground: "#143A6E",
    roleIconBackground: "#204879",
    roleIconSelectedBackground: "#2C7BFF",
    iconBadgeBackground: "#143A6E",
  },
};
