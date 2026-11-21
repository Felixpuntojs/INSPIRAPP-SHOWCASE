import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import { getUserProfile, saveUserCategories } from "@/lib/user-profile";
import { useRouter } from "expo-router";

export default function CategoriesScreen() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const user = auth.currentUser;
      if (!user) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const profile = await getUserProfile(user.uid);
      if (!isMounted) {
        return;
      }

      setSelectedCategories(profile?.categories ?? []);
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
  }, []);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      return [...current, category];
    });
  };

  const handleSaveCategories = async () => {
    const user = auth.currentUser;
    if (!user || isSaving) {
      return;
    }

    setErrorMessage("");
    try {
      setIsSaving(true);
      const wasSaved = await saveUserCategories(
        user.uid,
        selectedCategories,
        true,
      );

      if (!wasSaved) {
        setErrorMessage(
          "No se pudo guardar por permisos de Firebase. Revisa reglas de Firestore.",
        );
        return;
      }

      router.back();
    } catch {
      setErrorMessage(
        "No se pudo guardar por permisos de Firebase. Revisa reglas de Firestore.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.contentBlock}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons
              name="arrow-back-ios-new"
              size={22}
              color={Inspira.palette.text}
            />
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Escoge tus categorías
          </ThemedText>
        </View>

        <ThemedText muted style={styles.subtitle}>
          Selecciona y deselecciona las que quieras
        </ThemedText>

        {isLoading ? (
          <ThemedText muted style={styles.loadingText}>
            Cargando categorías...
          </ThemedText>
        ) : null}

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
                style={[
                  styles.chip,
                  isSelected ? styles.chipSelected : undefined,
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipLabel,
                    isSelected ? styles.chipLabelSelected : undefined,
                  ]}
                >
                  {category}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={[
            styles.saveButton,
            isSaving ? styles.saveButtonDisabled : undefined,
          ]}
          onPress={handleSaveCategories}
          disabled={isSaving || isLoading}
        >
          <ThemedText style={styles.saveButtonLabel}>
            {isSaving ? "Guardando..." : "Guardar categorías"}
          </ThemedText>
        </Pressable>

        {errorMessage ? (
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: Inspira.spacing.lg,
    paddingBottom: Inspira.spacing.xl,
  },
  contentBlock: {
    flex: 1,
    marginTop: Inspira.spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Inspira.spacing.sm,
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
    marginTop: Inspira.spacing.md,
  },
  loadingText: {
    marginTop: Inspira.spacing.sm,
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
    color: Inspira.palette.textMuted,
  },
  chipLabelSelected: {
    color: Inspira.palette.text,
    fontWeight: "600",
  },
  saveButton: {
    height: 48,
    borderRadius: Inspira.radii.md,
    backgroundColor: Inspira.palette.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonLabel: {
    color: "#22180A",
    fontWeight: "700",
  },
  errorText: {
    marginTop: Inspira.spacing.sm,
    color: Inspira.palette.danger,
  },
});
