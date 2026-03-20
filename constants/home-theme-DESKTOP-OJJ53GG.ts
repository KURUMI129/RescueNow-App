import { RescueNowColors } from "./rescuenow-colors";

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
    background: RescueNowColors.background,
    surface: RescueNowColors.surface,
    cardBorder: RescueNowColors.border,
    textPrimary: RescueNowColors.text,
    textSecondary: RescueNowColors.textMuted,
    primary: RescueNowColors.primary,
    accent: RescueNowColors.accent,
    danger: RescueNowColors.danger,
    tracking: RescueNowColors.tracking,
    success: RescueNowColors.success,
    onPrimary: RescueNowColors.surface,
    mapBackground: RescueNowColors.surface,
    mapGrid: RescueNowColors.tracking,
    userPin: RescueNowColors.primary,
    technicianPin: RescueNowColors.accent,
  },
  dark: {
    background: RescueNowColors.background,
    surface: RescueNowColors.surface,
    cardBorder: RescueNowColors.border,
    textPrimary: RescueNowColors.text,
    textSecondary: RescueNowColors.textMuted,
    primary: RescueNowColors.primary,
    accent: RescueNowColors.accent,
    danger: RescueNowColors.danger,
    tracking: RescueNowColors.tracking,
    success: RescueNowColors.success,
    onPrimary: RescueNowColors.surface,
    mapBackground: RescueNowColors.surface,
    mapGrid: RescueNowColors.tracking,
    userPin: RescueNowColors.primary,
    technicianPin: RescueNowColors.accent,
  },
};
