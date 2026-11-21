import { Platform } from "react-native";

const palette = {
  bg: "#0B0B14",
  bgElevated: "#13131F",
  surface: "#1A1A28",
  surfaceHigh: "#222234",
  border: "rgba(212, 162, 76, 0.18)",
  borderStrong: "rgba(212, 162, 76, 0.35)",
  gold: "#D4A24C",
  goldSoft: "#E0B158",
  goldDim: "rgba(212, 162, 76, 0.55)",
  text: "#F5F1E6",
  textMuted: "#A8A496",
  textDim: "#6F6B5E",
  danger: "#E07A5F",
  success: "#7FB069",
};

export const Colors = {
  light: {
    text: palette.text,
    background: palette.bg,
    tint: palette.gold,
    icon: palette.textMuted,
    tabIconDefault: palette.textMuted,
    tabIconSelected: palette.gold,
  },
  dark: {
    text: palette.text,
    background: palette.bg,
    tint: palette.gold,
    icon: palette.textMuted,
    tabIconDefault: palette.textMuted,
    tabIconSelected: palette.gold,
  },
};

export const Inspira = {
  palette,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    sm: 8,
    md: 14,
    lg: 22,
    pill: 999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 40,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
})!;
