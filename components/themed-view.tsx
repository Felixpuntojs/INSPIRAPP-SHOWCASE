import { View, type ViewProps } from "react-native";

import { Inspira } from "@/constants/theme";

export type ThemedViewProps = ViewProps & {
  surface?: "bg" | "elevated" | "surface" | "high";
};

const surfaceMap = {
  bg: Inspira.palette.bg,
  elevated: Inspira.palette.bgElevated,
  surface: Inspira.palette.surface,
  high: Inspira.palette.surfaceHigh,
} as const;

export function ThemedView({
  style,
  surface = "bg",
  ...otherProps
}: ThemedViewProps) {
  return (
    <View
      style={[{ backgroundColor: surfaceMap[surface] }, style]}
      {...otherProps}
    />
  );
}
