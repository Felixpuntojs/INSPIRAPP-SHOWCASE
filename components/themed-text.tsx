import { StyleSheet, Text, type TextProps } from "react-native";

import { Fonts, Inspira } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
    | "display"
    | "defaultSemiBold"
    | "subtitle"
    | "caption"
    | "link";
  muted?: boolean;
  gold?: boolean;
};

export function ThemedText({
  style,
  type = "default",
  muted = false,
  gold = false,
  ...rest
}: ThemedTextProps) {
  const color = gold
    ? Inspira.palette.gold
    : muted
      ? Inspira.palette.textMuted
      : Inspira.palette.text;

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "display" ? styles.display : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "caption" ? styles.caption : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: Inspira.fontSize.md,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: Inspira.fontSize.md,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: Inspira.fontSize.xxl,
    lineHeight: 34,
    fontFamily: Fonts.serif,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  display: {
    fontSize: Inspira.fontSize.display,
    lineHeight: 48,
    fontFamily: Fonts.serif,
    fontWeight: "700",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: Inspira.fontSize.lg,
    lineHeight: 26,
    fontFamily: Fonts.serif,
    fontWeight: "500",
  },
  caption: {
    fontSize: Inspira.fontSize.xs,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  link: {
    fontSize: Inspira.fontSize.md,
    lineHeight: 24,
    color: Inspira.palette.gold,
    fontWeight: "600",
  },
});
