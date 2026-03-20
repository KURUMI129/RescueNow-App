import { RescueNowColors } from "./rescuenow-colors";

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
    background: RescueNowColors.background,
    surface: RescueNowColors.surface,
    cardBorder: RescueNowColors.border,
    textPrimary: RescueNowColors.text,
    textSecondary: RescueNowColors.textMuted,
    inputBackground: RescueNowColors.surface,
    inputBorder: RescueNowColors.border,
    inputPlaceholder: RescueNowColors.text,
    primary: RescueNowColors.primary,
    primaryDisabled: RescueNowColors.primary,
    onPrimary: RescueNowColors.surface,
    roleCardBackground: RescueNowColors.surface,
    roleCardBorder: RescueNowColors.border,
    roleCardSelectedBackground: RescueNowColors.tracking,
    roleIconBackground: RescueNowColors.surface,
    roleIconSelectedBackground: RescueNowColors.primary,
    iconBadgeBackground: RescueNowColors.tracking,
  },
  dark: {
    background: RescueNowColors.background,
    surface: RescueNowColors.surface,
    cardBorder: RescueNowColors.border,
    textPrimary: RescueNowColors.text,
    textSecondary: RescueNowColors.textMuted,
    inputBackground: RescueNowColors.surface,
    inputBorder: RescueNowColors.border,
    inputPlaceholder: RescueNowColors.text,
    primary: RescueNowColors.primary,
    primaryDisabled: RescueNowColors.primary,
    onPrimary: RescueNowColors.surface,
    roleCardBackground: RescueNowColors.surface,
    roleCardBorder: RescueNowColors.border,
    roleCardSelectedBackground: RescueNowColors.tracking,
    roleIconBackground: RescueNowColors.surface,
    roleIconSelectedBackground: RescueNowColors.primary,
    iconBadgeBackground: RescueNowColors.tracking,
  },
};
