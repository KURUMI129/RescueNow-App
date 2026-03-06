export type HomeThemeColors = {
  background: string;
  surface: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  accent: string;
  danger: string;
  onPrimary: string;
  mapBackground: string;
  mapGrid: string;
  userPin: string;
  technicianPin: string;
};

export const HOME_THEME_COLORS: Record<'light' | 'dark', HomeThemeColors> = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    cardBorder: '#dbe2ea',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    primary: '#2563eb',
    accent: '#d97706',
    danger: '#dc2626',
    onPrimary: '#ffffff',
    mapBackground: '#edf4ff',
    mapGrid: '#cfe1fb',
    userPin: '#2563eb',
    technicianPin: '#d97706',
  },
  dark: {
    background: '#091427',
    surface: '#0f1d35',
    cardBorder: '#20324d',
    textPrimary: '#eaf2ff',
    textSecondary: '#b8c7dd',
    primary: '#3b82f6',
    accent: '#f59e0b',
    danger: '#ef4444',
    onPrimary: '#f8fbff',
    mapBackground: '#132540',
    mapGrid: '#2a3f60',
    userPin: '#60a5fa',
    technicianPin: '#fbbf24',
  },
};
