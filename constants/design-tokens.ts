export type ThemeMode = "light" | "dark";

export interface DesignTokens {
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    success: string;
    warning: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
  };
  typography: {
    display: { fontSize: number; fontWeight: number; letterSpacing: number };
    h1: { fontSize: number; fontWeight: number; letterSpacing: number };
    h2: { fontSize: number; fontWeight: number };
    h3: { fontSize: number; fontWeight: number };
    body: { fontSize: number; fontWeight: number; lineHeight: number };
    caption: { fontSize: number; fontWeight: number };
    small: { fontSize: number; fontWeight: number; letterSpacing: number; textTransform: string };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  animation: {
    duration: {
      micro: number;
      standard: number;
      emphasis: number;
    };
    easing: {
      default: string;
      bounce: string;
      smooth: string;
    };
  };
}

const colorsDark = {
  primary: "#DC2626",
  primaryHover: "#EF4444",
  secondary: "#0EA5E9",
  success: "#22C55E",
  warning: "#F59E0B",
  background: "#0F172A",
  surface: "rgba(30, 41, 59, 0.85)",
  surfaceElevated: "rgba(51, 65, 85, 0.90)",
  border: "rgba(148, 163, 184, 0.2)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
} as const;

const colorsLight = {
  primary: "#DC2626",
  primaryHover: "#B91C1C",
  secondary: "#0EA5E9",
  success: "#22C55E",
  warning: "#F59E0B",
  background: "#F8FAFC",
  surface: "rgba(255, 255, 255, 0.85)",
  surfaceElevated: "rgba(255, 255, 255, 0.95)",
  border: "rgba(148, 163, 184, 0.3)",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
} as const;

export const DESIGN_TOKENS: Record<ThemeMode, DesignTokens> = {
  dark: {
    colors: colorsDark,
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48, "3xl": 64 },
    typography: {
      display: { fontSize: 32, fontWeight: 700, letterSpacing: -0.02 },
      h1: { fontSize: 28, fontWeight: 600, letterSpacing: -0.01 },
      h2: { fontSize: 24, fontWeight: 600 },
      h3: { fontSize: 20, fontWeight: 600 },
      body: { fontSize: 16, fontWeight: 400, lineHeight: 24 },
      caption: { fontSize: 14, fontWeight: 400 },
      small: { fontSize: 12, fontWeight: 500, letterSpacing: 0.05, textTransform: "uppercase" },
    },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
    animation: {
      duration: { micro: 150, standard: 300, emphasis: 500 },
      easing: { default: "ease", bounce: "cubic-bezier(0.68, -0.55, 0.27, 1.55)", smooth: "cubic-bezier(0.4, 0, 0.2, 1)" },
    },
  },
  light: {
    colors: colorsLight,
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48, "3xl": 64 },
    typography: {
      display: { fontSize: 32, fontWeight: 700, letterSpacing: -0.02 },
      h1: { fontSize: 28, fontWeight: 600, letterSpacing: -0.01 },
      h2: { fontSize: 24, fontWeight: 600 },
      h3: { fontSize: 20, fontWeight: 600 },
      body: { fontSize: 16, fontWeight: 400, lineHeight: 24 },
      caption: { fontSize: 14, fontWeight: 400 },
      small: { fontSize: 12, fontWeight: 500, letterSpacing: 0.05, textTransform: "uppercase" },
    },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
    animation: {
      duration: { micro: 150, standard: 300, emphasis: 500 },
      easing: { default: "ease", bounce: "cubic-bezier(0.68, -0.55, 0.27, 1.55)", smooth: "cubic-bezier(0.4, 0, 0.2, 1)" },
    },
  },
};