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

export const AUTH_THEME_COLORS: Record<'light' | 'dark', AuthThemeColors> = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    cardBorder: '#dbe2ea',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    inputBackground: '#f8fbff',
    inputBorder: '#dbe2ea',
    inputPlaceholder: '#94a3b8',
    primary: '#2563eb',
    primaryDisabled: '#93b3f3',
    onPrimary: '#ffffff',
    roleCardBackground: '#ffffff',
    roleCardBorder: '#dbe2ea',
    roleCardSelectedBackground: '#edf3ff',
    roleIconBackground: '#dbe9ff',
    roleIconSelectedBackground: '#2563eb',
    iconBadgeBackground: '#e7efff',
  },
  dark: {
    background: '#091427',
    surface: '#0f1d35',
    cardBorder: '#20324d',
    textPrimary: '#eaf2ff',
    textSecondary: '#b8c7dd',
    inputBackground: '#132540',
    inputBorder: '#2a3f60',
    inputPlaceholder: '#89a0c3',
    primary: '#3b82f6',
    primaryDisabled: '#35527f',
    onPrimary: '#f8fbff',
    roleCardBackground: '#132540',
    roleCardBorder: '#2a3f60',
    roleCardSelectedBackground: '#1c3561',
    roleIconBackground: '#274a7d',
    roleIconSelectedBackground: '#3b82f6',
    iconBadgeBackground: '#1c3561',
  },
};
