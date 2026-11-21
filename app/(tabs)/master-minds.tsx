import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MASTER_MIND_OPTIONS } from "@/constants/master-minds";
import { Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import { getUserProfile, saveUserMasterMinds } from "@/lib/user-profile";
import { useRouter } from "expo-router";

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

export default function MasterMindsScreen() {
  const router = useRouter();
  const [selectedMasterMinds, setSelectedMasterMinds] = useState<string[]>([]);
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

      setSelectedMasterMinds(profile?.masterMinds ?? []);
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

  const toggleMasterMind = (name: string) => {
    setSelectedMasterMinds((current) => {
      if (current.includes(name)) {
        return current.filter((item) => item !== name);
      }

      return [...current, name];
    });
  };

  const handleSaveMasterMinds = async () => {
    const user = auth.currentUser;
    if (!user || isSaving) {
      return;
    }

    setErrorMessage("");
    try {
      setIsSaving(true);
      const wasSaved = await saveUserMasterMinds(
        user.uid,
        selectedMasterMinds,
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
            Escoge mentes maestras
          </ThemedText>
        </View>

        <ThemedText muted style={styles.subtitle}>
          Sigue las huellas de los grandes sabios
        </ThemedText>

        {isLoading ? (
          <ThemedText muted style={styles.loadingText}>
            Cargando mentes maestras...
          </ThemedText>
        ) : null}

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
                style={[
                  styles.card,
                  isSelected ? styles.cardSelected : undefined,
                ]}
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

        <Pressable
          style={[
            styles.saveButton,
            isSaving ? styles.saveButtonDisabled : undefined,
          ]}
          onPress={handleSaveMasterMinds}
          disabled={isSaving || isLoading}
        >
          <ThemedText style={styles.saveButtonLabel}>
            {isSaving ? "Guardando..." : "Guardar mentes maestras"}
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
