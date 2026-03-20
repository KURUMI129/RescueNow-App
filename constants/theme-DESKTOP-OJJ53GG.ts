import { Platform } from 'react-native';
import { RescueNowColors } from './rescuenow-colors';

const tintColorLight = RescueNowColors.primary;
const tintColorDark = RescueNowColors.primary;

export const Colors = {
  light: {
    text: RescueNowColors.text,
    background: RescueNowColors.background,
    tint: tintColorLight,
    icon: RescueNowColors.textMuted,
    tabIconDefault: RescueNowColors.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: RescueNowColors.text,
    background: RescueNowColors.background,
    tint: tintColorDark,
    icon: RescueNowColors.textMuted,
    tabIconDefault: RescueNowColors.textMuted,
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
