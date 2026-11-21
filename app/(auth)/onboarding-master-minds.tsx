import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { MASTER_MIND_OPTIONS } from "@/constants/master-minds";
import { Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import { getUserProfile, saveUserMasterMinds } from "@/lib/user-profile";

function getInitials(name: string): string {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function OnboardingMasterMindsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedMasterMinds, setSelectedMasterMinds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }

      const profile = await getUserProfile(user.uid);

      if (!isMounted) {
        return;
      }

      if (profile?.onboardingCompleted) {
        router.replace("/(tabs)");
        return;
      }

      if (!profile?.categories?.length) {
        router.replace("/(auth)/onboarding-categories");
        return;
      }

      if (profile?.masterMinds?.length) {
        setSelectedMasterMinds(profile.masterMinds);
      }

      setIsLoading(false);
    }

    loadProfile().catch(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const canContinue = selectedMasterMinds.length > 0 && !isSaving;

  const selectionLabel = useMemo(() => {
    if (selectedMasterMinds.length === 0) {
      return "Elige al menos una mente maestra";
    }

    return `${selectedMasterMinds.length} mentes maestras seleccionadas`;
  }, [selectedMasterMinds.length]);

  const toggleMasterMind = (name: string) => {
    setSelectedMasterMinds((current) => {
      if (current.includes(name)) {
        return current.filter((item) => item !== name);
      }

      return [...current, name];
    });
  };

  const handleContinue = async () => {
    const user = auth.currentUser;
    if (!user || !canContinue) {
      return;
    }

    setErrorMessage("");
    try {
      setIsSaving(true);
      const wasSaved = await saveUserMasterMinds(
        user.uid,
        selectedMasterMinds,
        false,
      );

      if (!wasSaved) {
        setErrorMessage(
          "No se pudo guardar por permisos de Firebase. Revisa reglas de Firestore.",
        );
        return;
      }

      router.replace("/(auth)/onboarding-notification-time");
    } catch {
      setErrorMessage(
        "No se pudo guardar por permisos de Firebase. Revisa reglas de Firestore.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ThemedText muted>Cargando mentes maestras...</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.contentBlock}>
        <ThemedText type="caption" gold style={styles.stepLabel}>
          ONBOARDING (2/3)
        </ThemedText>

        <ThemedText type="title" style={styles.title}>
          Mentes Maestras
        </ThemedText>
        <ThemedText muted style={styles.subtitle}>
          Sigue las huellas de los grandes sabios
        </ThemedText>

        <ThemedText muted style={styles.selectedInfo}>
          {selectionLabel}
        </ThemedText>

        <ScrollView
          style={styles.cardsWrap}
          contentContainerStyle={styles.cardsContent}
          showsVerticalScrollIndicator={false}
        >
          {MASTER_MIND_OPTIONS.map((masterMind) => {
            const isSelected = selectedMasterMinds.includes(masterMind.name);

            return (
              <Pressable
                key={masterMind.name}
                onPress={() => toggleMasterMind(masterMind.name)}
                style={[styles.card, isSelected ? styles.cardSelected : null]}
              >
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeLabel}>
                    {getInitials(masterMind.name)}
                  </ThemedText>
                </View>

                <View style={styles.cardBody}>
                  <ThemedText style={styles.cardTitle}>
                    {masterMind.name}
                  </ThemedText>
                  <ThemedText muted style={styles.cardSubtitle}>
                    {masterMind.role}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {errorMessage ? (
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}
      </View>

      <Pressable
        onPress={handleContinue}
        disabled={!canContinue}
        style={[
          styles.continueButton,
          { marginBottom: Math.max(insets.bottom, 12) },
          !canContinue ? styles.disabledButton : null,
        ]}
      >
        <ThemedText style={styles.continueLabel}>
          {isSaving ? "Guardando..." : "Siguiente"}
        </ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
    paddingHorizontal: Inspira.spacing.lg,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  contentBlock: {
    flex: 1,
    paddingTop: 56,
  },
  glowTop: {
    position: "absolute",
    top: -180,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Inspira.palette.gold,
    opacity: 0.05,
  },
  glowBottom: {
    position: "absolute",
    bottom: -200,
    left: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Inspira.palette.gold,
    opacity: 0.04,
  },
  stepLabel: {
    letterSpacing: 1.2,
    marginBottom: Inspira.spacing.xs,
  },
  title: {
    marginTop: Inspira.spacing.sm,
  },
  subtitle: {
    marginTop: Inspira.spacing.sm,
  },
  selectedInfo: {
    marginTop: Inspira.spacing.md,
    fontSize: Inspira.fontSize.sm,
  },
  cardsWrap: {
    flex: 1,
    marginTop: Inspira.spacing.lg,
  },
  cardsContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Inspira.spacing.sm,
    paddingBottom: Inspira.spacing.xl,
  },
  card: {
    width: "48.5%",
    minHeight: 96,
    borderRadius: Inspira.radii.md,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: Inspira.palette.bgElevated,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  cardSelected: {
    borderColor: Inspira.palette.gold,
    backgroundColor: "rgba(212, 162, 76, 0.12)",
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Inspira.palette.goldDim,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212, 162, 76, 0.14)",
  },
  badgeLabel: {
    color: Inspira.palette.gold,
    fontSize: 11,
    fontWeight: "700",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: Inspira.palette.text,
    fontSize: Inspira.fontSize.sm,
    lineHeight: 18,
    fontWeight: "700",
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  continueButton: {
    marginTop: Inspira.spacing.md,
    height: 52,
    borderRadius: Inspira.radii.pill,
    backgroundColor: Inspira.palette.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.45,
  },
  continueLabel: {
    color: "#22180A",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  errorText: {
    color: Inspira.palette.danger,
    marginTop: Inspira.spacing.sm,
  },
});
