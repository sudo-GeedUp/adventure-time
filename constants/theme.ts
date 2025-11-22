import { Platform } from "react-native";

const primary = "#FF6B35";
const secondary = "#8B4513";
const accent = "#2196F3";
const success = "#2E7D32";
const warning = "#FBC02D";
const error = "#D32F2F";

export const Colors = {
  light: {
    text: "#000000",
    buttonText: "#FFFFFF",
    tabIconDefault: "#BDBDBD",
    tabIconSelected: primary,
    link: accent,
    primary,
    secondary,
    accent,
    success,
    warning,
    error,
    border: "#BDBDBD",
    backgroundRoot: "#F5F5F5", // Elevation 0
    backgroundDefault: "#FFFFFF", // Elevation 1
    backgroundSecondary: "#FAFAFA", // Elevation 2
    backgroundTertiary: "#F0F0F0", // Elevation 3
  },
  dark: {
    text: "#FFFFFF",
    buttonText: "#FFFFFF",
    tabIconDefault: "#757575",
    tabIconSelected: primary,
    link: accent,
    primary,
    secondary,
    accent,
    success,
    warning,
    error,
    border: "#424242",
    backgroundRoot: "#1E1E1E", // Elevation 0
    backgroundDefault: "#2A2A2A", // Elevation 1
    backgroundSecondary: "#333333", // Elevation 2
    backgroundTertiary: "#3D3D3D", // Elevation 3
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 56,
  buttonHeight: 56,
  fabSize: 72,
  minTouchTarget: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 18,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  label: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  button: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  link: {
    fontSize: 18,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
