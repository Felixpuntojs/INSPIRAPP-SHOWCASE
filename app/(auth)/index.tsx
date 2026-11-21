import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { InspiraLogo } from "@/components/inspira-logo";
import { ThemedText } from "@/components/themed-text";
import { Inspira } from "@/constants/theme";

const AUTO_ADVANCE_MS = 5500;

export default function SplashScreen() {
  const router = useRouter();
  const phrase = "Bienvenido a la inspiración";

  const logoOpacity = useSharedValue(0);
  const logoTranslate = useSharedValue(12);
  const phraseOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    logoTranslate.value = withTiming(0, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    phraseOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    const t = setTimeout(() => {
      router.replace("/login");
    }, AUTO_ADVANCE_MS);

    return () => clearTimeout(t);
  }, [logoOpacity, logoTranslate, phraseOpacity, router]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslate.value }],
  }));

  const phraseStyle = useAnimatedStyle(() => ({
    opacity: phraseOpacity.value,
  }));

  const goNow = () => router.replace("/login");

  return (
    <Pressable
      style={styles.root}
      onPress={goNow}
      accessibilityRole="button"
      accessibilityLabel="Entrar a Inspira"
    >
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <InspiraLogo size="lg" wordmarkStyle={styles.logoWordmark} />
      </Animated.View>

      <Animated.View style={[styles.phraseWrap, phraseStyle]}>
        <ThemedText style={styles.phrase} muted>
          {`"${phrase}"`}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Inspira.spacing.xl,
  },
  glowTop: {
    position: "absolute",
    top: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Inspira.palette.gold,
    opacity: 0.04,
  },
  glowBottom: {
    position: "absolute",
    bottom: -160,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: Inspira.palette.gold,
    opacity: 0.03,
  },
  logoWrap: {
    marginBottom: Inspira.spacing.xl,
  },
  logoWordmark: {
    marginTop: 2,
  },
  phraseWrap: {
    maxWidth: 320,
  },
  phrase: {
    fontStyle: "italic",
    textAlign: "center",
    fontSize: Inspira.fontSize.md,
    lineHeight: 24,
  },
});
