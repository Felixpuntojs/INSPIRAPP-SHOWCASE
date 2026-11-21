import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import { getUserProfile, saveUserCategories } from "@/lib/user-profile";

export default function OnboardingCategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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

      if (profile?.categories?.length && !profile?.masterMinds?.length) {
        router.replace("/(auth)/onboarding-master-minds");
        return;
      }

      if (profile?.categories?.length) {
        setSelectedCategories(profile.categories);
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

  const canContinue = selectedCategories.length > 0 && !isSaving;

  const selectionLabel = useMemo(() => {
    if (selectedCategories.length === 0) {
      return "Elige al menos una categoría";
    }

    return `${selectedCategories.length} categorías seleccionadas`;
  }, [selectedCategories.length]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      return [...current, category];
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
      const wasSaved = await saveUserCategories(
        user.uid,
        selectedCategories,
        false,
      );

      if (!wasSaved) {
        setErrorMessage(
          "No se pudo guardar por permisos de Firebase. Revisa reglas de Firestore.",
        );
        return;
      }

      router.replace("/(auth)/onboarding-master-minds");
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
        <ThemedText muted>Cargando categorías...</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.contentBlock}>
        <ThemedText type="caption" gold style={styles.stepLabel}>
          ONBOARDING (1/3)
        </ThemedText>

        <ThemedText type="title" style={styles.title}>
          Categorías del Alma
        </ThemedText>
        <ThemedText muted style={styles.subtitle}>
          ¿Qué áreas deseas nutrir hoy?
        </ThemedText>
        <ThemedText muted style={styles.selectedInfo}>
          {selectionLabel}
        </ThemedText>

        <ScrollView
          style={styles.chipsWrap}
          contentContainerStyle={styles.chipsContent}
          showsVerticalScrollIndicator={false}
        >
          {CATEGORY_OPTIONS.map((category) => {
            const isSelected = selectedCategories.includes(category);

            return (
              <Pressable
                key={category}
                onPress={() => toggleCategory(category)}
                style={[styles.chip, isSelected ? styles.chipSelected : null]}
              >
                <ThemedText
                  style={[
                    styles.chipLabel,
                    isSelected ? styles.chipLabelSelected : null,
                  ]}
                >
                  {category}
                </ThemedText>
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
  contentBlock: {
    flex: 1,
    paddingTop: 56,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
    justifyContent: "center",
    alignItems: "center",
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
    maxWidth: 280,
  },
  subtitle: {
    marginTop: Inspira.spacing.sm,
  },
  selectedInfo: {
    marginTop: Inspira.spacing.md,
    fontSize: Inspira.fontSize.sm,
  },
  chipsWrap: {
    flex: 1,
    marginTop: Inspira.spacing.lg,
  },
  chipsContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Inspira.spacing.sm,
    paddingBottom: Inspira.spacing.xl,
  },
  chip: {
    borderRadius: Inspira.radii.pill,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    borderColor: Inspira.palette.gold,
    backgroundColor: "rgba(212, 162, 76, 0.12)",
  },
  chipLabel: {
    fontSize: Inspira.fontSize.md,
    color: Inspira.palette.textMuted,
  },
  chipLabelSelected: {
    color: Inspira.palette.text,
    fontWeight: "600",
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
    marginBottom: Inspira.spacing.sm,
  },
});
