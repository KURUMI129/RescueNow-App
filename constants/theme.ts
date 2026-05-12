import { DESIGN_TOKENS, type ThemeMode } from "./design-tokens";

export interface Theme {
  colors: typeof DESIGN_TOKENS.dark.colors;
  spacing: typeof DESIGN_TOKENS.dark.spacing;
  typography: typeof DESIGN_TOKENS.dark.typography;
  borderRadius: typeof DESIGN_TOKENS.dark.borderRadius;
  animation: typeof DESIGN_TOKENS.dark.animation;
}

export function createTheme(mode: ThemeMode): Theme {
  return DESIGN_TOKENS[mode];
}

export const darkTheme = createTheme("dark");
export const lightTheme = createTheme("light");