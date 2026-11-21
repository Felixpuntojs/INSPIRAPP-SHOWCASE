import {
  Image,
  StyleSheet,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Fonts, Inspira } from "@/constants/theme";

type Props = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  style?: ViewStyle;
  wordmarkStyle?: TextStyle;
};

const sizes = {
  sm: { ring: 44, ringBorder: 1.5, letter: 20, gap: 12, wordmark: 18 },
  md: { ring: 64, ringBorder: 2, letter: 28, gap: 18, wordmark: 24 },
  lg: { ring: 84, ringBorder: 2.5, letter: 38, gap: 24, wordmark: 32 },
} as const;

export function InspiraLogo({
  size = "md",
  showWordmark = true,
  style,
  wordmarkStyle,
}: Props) {
  const s = sizes[size];
  const logoSize = size === "sm" ? 110 : size === "md" ? 160 : 220;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require("../LOGOS/LOGO INSPIRAPP.png")}
        style={[
          styles.logoImage,
          {
            width: logoSize,
            height: logoSize * 0.9,
          },
        ]}
        resizeMode="contain"
      />
      {showWordmark ? (
        <ThemedText
          style={[
            styles.wordmark,
            { fontSize: s.wordmark, marginTop: s.gap },
            wordmarkStyle,
          ]}
        >
          INSPIRA
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    resizeMode: "contain",
    backgroundColor: "transparent",
  },
  wordmark: {
    fontFamily: Fonts.serif,
    fontWeight: "500",
    color: Inspira.palette.text,
    letterSpacing: 8,
  },
});
