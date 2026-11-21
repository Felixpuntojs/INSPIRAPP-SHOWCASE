import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Fonts, Inspira } from "@/constants/theme";

function getSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default function PhraseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phraseId?: string | string[];
    phrase?: string | string[];
    category?: string | string[];
    masterMind?: string | string[];
    role?: string | string[];
  }>();

  const phrase = getSingleParam(params.phrase);
  const category = getSingleParam(params.category);
  const masterMind = getSingleParam(params.masterMind);
  const role = getSingleParam(params.role);

  const title = useMemo(() => masterMind || "Frase", [masterMind]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons
            name="arrow-back-ios-new"
            size={22}
            color={Inspira.palette.text}
          />
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
      </View>

      <ThemedText muted style={styles.subtitle}>
        {role || category}
      </ThemedText>

      <View style={styles.paperCard}>
        <View style={styles.paperTextureLineOne} />
        <View style={styles.paperTextureLineTwo} />
        <View style={styles.paperAccent} />

        <View style={styles.quoteBlock}>
          <MaterialIcons
            name="format-quote"
            size={28}
            color={Inspira.palette.gold}
          />
          <ThemedText style={styles.phraseText}>{phrase}</ThemedText>
        </View>

        <ThemedText style={styles.authorText}>
          — {masterMind || "Inspira"}.
        </ThemedText>

        <View style={styles.tagsRow}>
          {category ? (
            <View style={styles.tagChip}>
              <ThemedText style={styles.tagLabel}>{category}</ThemedText>
            </View>
          ) : null}
          {role ? (
            <View style={styles.tagChipSecondary}>
              <ThemedText style={styles.tagLabelSecondary}>{role}</ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
    paddingHorizontal: Inspira.spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Inspira.spacing.sm,
    marginTop: Inspira.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
  },
  subtitle: {
    marginTop: Inspira.spacing.sm,
    marginBottom: Inspira.spacing.lg,
  },
  paperCard: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#E8D9BC",
    borderWidth: 1,
    borderColor: "rgba(42, 36, 24, 0.10)",
    paddingHorizontal: Inspira.spacing.lg,
    paddingVertical: Inspira.spacing.xl,
    justifyContent: "center",
    gap: Inspira.spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  paperAccent: {
    position: "absolute",
    top: 28,
    right: 28,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(212, 162, 76, 0.10)",
  },
  paperTextureLineOne: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(72, 52, 26, 0.05)",
  },
  paperTextureLineTwo: {
    position: "absolute",
    top: 78,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(72, 52, 26, 0.04)",
  },
  quoteBlock: {
    alignItems: "center",
    justifyContent: "center",
    gap: Inspira.spacing.md,
  },
  phraseText: {
    color: "#241C10",
    fontFamily: Fonts.serif,
    fontStyle: "italic",
    fontSize: 29,
    lineHeight: 41,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.1,
    maxWidth: 320,
  },
  authorText: {
    color: "#2D2213",
    fontFamily: Fonts.serif,
    fontStyle: "italic",
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "600",
    textAlign: "center",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Inspira.spacing.sm,
    justifyContent: "center",
    marginTop: Inspira.spacing.sm,
  },
  tagChip: {
    borderRadius: Inspira.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(36, 28, 16, 0.08)",
  },
  tagChipSecondary: {
    borderRadius: Inspira.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(212, 162, 76, 0.18)",
  },
  tagLabel: {
    color: "#3A2D19",
    fontWeight: "700",
  },
  tagLabelSecondary: {
    color: "#2D2213",
    fontWeight: "700",
  },
  footerText: {
    textAlign: "center",
    color: "#5A4A32",
  },
});
