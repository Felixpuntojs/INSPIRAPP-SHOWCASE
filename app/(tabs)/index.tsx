import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Inspira } from "@/constants/theme";
import {
  loadAudioTracks,
  pickDailyAudioTrack,
  type AudioTrack,
} from "@/lib/audio-library";
import { auth } from "@/lib/firebase";
import {
  createDayKey,
  extractFirstName,
  loadPhrasesForUserProfile,
  pickDailyPhrase,
  type PhraseRecord,
} from "@/lib/phrase-library";
import { getUserProfile } from "@/lib/user-profile";

export default function HomeScreen() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [firstName, setFirstName] = useState("Inspira");
  const [featuredPhrase, setFeaturedPhrase] = useState<PhraseRecord | null>(
    null,
  );
  const [dailyAudioTrack, setDailyAudioTrack] = useState<AudioTrack | null>(
    null,
  );
  const [isDailyAudioLoading, setIsDailyAudioLoading] = useState(true);
  const lastCheckedDayRef = useRef<string | null>(null);

  const loadHomeContent = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/login");
      return;
    }

    const todayDayKey = `${user.uid}:${createDayKey(new Date())}`;
    if (lastCheckedDayRef.current === todayDayKey) {
      return;
    }

    lastCheckedDayRef.current = todayDayKey;
    setIsDailyAudioLoading(true);

    void loadAudioTracks()
      .then((audioTracks) => {
        setDailyAudioTrack(pickDailyAudioTrack(audioTracks, todayDayKey));
      })
      .catch((error) => {
        console.warn("Could not load daily audio", error);
        setDailyAudioTrack(null);
      })
      .finally(() => {
        setIsDailyAudioLoading(false);
      });

    try {
      const profile = await getUserProfile(user.uid);

      const profileName = profile?.displayName?.trim() || "";
      const hasProfileName = Boolean(profileName && !profileName.includes("@"));
      const firebaseName = user.displayName?.trim() || "";
      const hasFirebaseName = Boolean(
        firebaseName && !firebaseName.includes("@"),
      );
      const displayName = hasProfileName
        ? profileName
        : hasFirebaseName
          ? firebaseName
          : "";

      const userName = extractFirstName(
        displayName,
        profile?.email || user.email,
      );

      setFirstName(userName);

      if (!profile) {
        setFeaturedPhrase(null);
        return;
      }

      const phrases = await loadPhrasesForUserProfile(profile);
      setFeaturedPhrase(pickDailyPhrase(phrases, todayDayKey));
    } catch {
      setFeaturedPhrase(null);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeContent();
    }, [loadHomeContent]),
  );

  useEffect(() => {
    const handleAppStateChange = (nextState: string) => {
      if (nextState !== "active") {
        return;
      }

      void loadHomeContent();
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    const refreshTimer = setInterval(() => {
      if (AppState.currentState === "active") {
        void loadHomeContent();
      }
    }, 60_000);

    void loadHomeContent();

    return () => {
      subscription.remove();
      clearInterval(refreshTimer);
    };
  }, [loadHomeContent]);

  const openCategoriesScreen = () => {
    setIsDropdownOpen(false);
    router.push("/(tabs)/categories");
  };

  const openMasterMindsScreen = () => {
    setIsDropdownOpen(false);
    router.push("/(tabs)/master-minds");
  };

  const openNotificationTimeScreen = () => {
    setIsDropdownOpen(false);
    router.push("/(tabs)/notification-time");
  };

  const openPhrasesScreen = () => {
    setIsDropdownOpen(false);
    router.push({ pathname: "/(tabs)/phrases" } as never);
  };

  const openAudioLibrary = () => {
    setIsDropdownOpen(false);
    router.push("/(tabs)/audio" as never);
  };

  const openDailyAudio = () => {
    if (!dailyAudioTrack) {
      return;
    }

    router.push({
      pathname: "/(tabs)/audio-player",
      params: { path: dailyAudioTrack.path, single: "true" },
    } as never);
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setErrorMessage("");
    try {
      setIsSigningOut(true);
      await signOut(auth);
      router.replace("/login");
    } catch {
      setErrorMessage("No se pudo cerrar sesión. Intenta nuevamente.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => setIsDropdownOpen((current) => !current)}
              style={({ pressed }) => [
                styles.hamburgerButton,
                pressed && styles.hamburgerButtonPressed,
              ]}
            >
              <ThemedText style={styles.hamburgerText}>☰</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="title" style={styles.greetingTitle}>
            Hola {firstName}
          </ThemedText>

          {isDropdownOpen ? (
            <ThemedView surface="elevated" style={styles.dropdownPanel}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuButton,
                  pressed && styles.menuButtonPressed,
                ]}
                onPress={openCategoriesScreen}
              >
                <ThemedText style={styles.menuButtonLabel}>
                  Categorías
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.menuButton,
                  pressed && styles.menuButtonPressed,
                ]}
                onPress={openMasterMindsScreen}
              >
                <ThemedText style={styles.menuButtonLabel}>
                  Mentes maestras
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.menuButton,
                  pressed && styles.menuButtonPressed,
                ]}
                onPress={openNotificationTimeScreen}
              >
                <ThemedText style={styles.menuButtonLabel}>
                  Hora de notificación
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.signOutButton,
                  isSigningOut ? styles.saveButtonDisabled : undefined,
                  pressed && styles.signOutButtonPressed,
                ]}
                onPress={handleSignOut}
                disabled={isSigningOut}
              >
                <ThemedText style={styles.signOutButtonLabel}>
                  {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </ThemedText>
              </Pressable>

              {errorMessage ? (
                <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
              ) : null}
            </ThemedView>
          ) : null}
        </View>

        {featuredPhrase ? (
          <View style={styles.featuredCard}>
            <View style={styles.featuredBadge}>
              <ThemedText style={styles.featuredBadgeLabel}>
                Frase del dia
              </ThemedText>
            </View>
            <ThemedText style={styles.featuredQuote}>
              “{featuredPhrase.phrase}”
            </ThemedText>
            <View style={styles.featuredAuthorBlock}>
              <ThemedText numberOfLines={1} style={styles.featuredAuthor}>
                {featuredPhrase.masterMindName}
              </ThemedText>
              <ThemedText muted style={styles.featuredRole} numberOfLines={1}>
                {featuredPhrase.masterMindRole || "Sin quien"}
              </ThemedText>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <ThemedText style={styles.metaChipLabel}>
                  {featuredPhrase.category}
                </ThemedText>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <ThemedText style={styles.emptyStateTitle}>
              Aún no hay frases para mostrar
            </ThemedText>
            <ThemedText muted style={styles.emptyStateText}>
              Elige categorías y mentes maestras para empezar a ver frases aquí.
            </ThemedText>
          </View>
        )}

        <Pressable
          accessibilityLabel="Reproducir el audio del día"
          accessibilityRole="button"
          disabled={!dailyAudioTrack || isDailyAudioLoading}
          onPress={openDailyAudio}
          style={({ pressed }) => [
            styles.audioButton,
            !dailyAudioTrack ? styles.audioButtonDisabled : undefined,
            pressed && styles.audioButtonPressed,
          ]}
        >
          <View style={styles.audioPlayIcon}>
            <Ionicons name="sparkles" size={17} color={Inspira.palette.bg} />
          </View>
          <View style={styles.audioButtonCopy}>
            <ThemedText numberOfLines={1} style={styles.audioButtonTitle}>
              Audio del día
            </ThemedText>
            <ThemedText muted numberOfLines={1} style={styles.audioButtonHint}>
              {isDailyAudioLoading
                ? "Buscando un audio para hoy..."
                : dailyAudioTrack
                  ? `${dailyAudioTrack.title} · ${dailyAudioTrack.voice}`
                  : "No hay audios disponibles"}
            </ThemedText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Inspira.palette.textMuted}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="Explorar frases"
          accessibilityRole="button"
          onPress={openPhrasesScreen}
          style={({ pressed }) => [
            styles.audioButton,
            pressed && styles.audioButtonPressed,
          ]}
        >
          <View style={styles.audioPlayIcon}>
            <Ionicons
              name="reader-outline"
              size={19}
              color={Inspira.palette.bg}
            />
          </View>
          <View style={styles.audioButtonCopy}>
            <ThemedText numberOfLines={1} style={styles.audioButtonTitle}>
              Explora frases
            </ThemedText>
            <ThemedText muted numberOfLines={1} style={styles.audioButtonHint}>
              Ideas para acompañar tu día
            </ThemedText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Inspira.palette.textMuted}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="Abrir biblioteca de audio"
          accessibilityRole="button"
          onPress={openAudioLibrary}
          style={({ pressed }) => [
            styles.audioButton,
            pressed && styles.audioButtonPressed,
          ]}
        >
          <View style={styles.audioPlayIcon}>
            <Ionicons name="play" size={15} color={Inspira.palette.bg} />
          </View>
          <View style={styles.audioButtonCopy}>
            <ThemedText numberOfLines={1} style={styles.audioButtonTitle}>
              Audio: encuentra tu momento
            </ThemedText>
            <ThemedText muted numberOfLines={1} style={styles.audioButtonHint}>
              Meditaciones y voces para acompañarte
            </ThemedText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Inspira.palette.textMuted}
          />
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 86,
    paddingHorizontal: Inspira.spacing.lg,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Inspira.spacing.xl,
  },
  headerBlock: {
    position: "relative",
    zIndex: 20,
    overflow: "visible",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  greetingTitle: {
    textAlign: "center",
    marginTop: Inspira.spacing.sm,
    marginBottom: Inspira.spacing.lg,
  },
  subtitle: {
    marginTop: Inspira.spacing.sm,
    marginBottom: Inspira.spacing.lg,
  },
  hamburgerButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Inspira.radii.pill,
  },
  hamburgerButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  hamburgerText: {
    fontSize: 22,
    lineHeight: 24,
    color: Inspira.palette.text,
  },
  featuredCard: {
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(42, 36, 24, 0.10)",
    backgroundColor: "#E8D9BC",
    padding: Inspira.spacing.lg,
    gap: Inspira.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  featuredBadge: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
  },
  featuredBadgeLabel: {
    color: "#5A4A32",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  featuredQuote: {
    color: "#241C10",
    fontFamily: Fonts.serif,
    fontStyle: "italic",
    fontSize: 24,
    lineHeight: 34,
    fontWeight: "600",
    textAlign: "center",
  },
  featuredAuthor: {
    color: "#2D2213",
    fontFamily: Fonts.serif,
    fontStyle: "italic",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: "100%",
  },
  featuredAuthorBlock: {
    alignItems: "center",
    gap: 6,
  },
  featuredRole: {
    color: "#5A4A32",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Inspira.spacing.sm,
  },
  metaChip: {
    borderRadius: Inspira.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(36, 28, 16, 0.08)",
  },
  metaChipLabel: {
    color: "#3A2D19",
    fontWeight: "600",
  },
  emptyStateCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: Inspira.palette.bgElevated,
    padding: Inspira.spacing.lg,
  },
  emptyStateTitle: {
    color: Inspira.palette.text,
    fontWeight: "700",
    marginBottom: Inspira.spacing.xs,
  },
  emptyStateText: {
    lineHeight: 22,
  },
  audioButton: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: Inspira.spacing.md,
    marginTop: Inspira.spacing.lg,
    paddingHorizontal: Inspira.spacing.md,
    borderWidth: 1,
    borderColor: Inspira.palette.borderStrong,
    borderRadius: Inspira.radii.md,
    backgroundColor: Inspira.palette.bgElevated,
  },
  audioButtonPressed: {
    backgroundColor: "rgba(212, 162, 76, 0.10)",
    borderColor: Inspira.palette.gold,
    transform: [{ scale: 0.995 }],
  },
  audioButtonDisabled: {
    opacity: 0.6,
  },
  audioPlayIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Inspira.radii.pill,
    backgroundColor: Inspira.palette.gold,
  },
  audioButtonCopy: {
    flex: 1,
    gap: 2,
  },
  audioButtonTitle: {
    fontWeight: "600",
  },
  audioButtonHint: {
    fontSize: Inspira.fontSize.xs,
  },
  sectionHeader: {
    marginTop: Inspira.spacing.lg,
    marginBottom: Inspira.spacing.sm,
  },
  chipsWrap: {
    gap: Inspira.spacing.sm,
  },
  selectionChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Inspira.radii.pill,
    borderWidth: 1,
    borderColor: Inspira.palette.borderStrong,
    backgroundColor: "rgba(212, 162, 76, 0.10)",
  },
  selectionChipAlt: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Inspira.radii.pill,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  selectionChipLabel: {
    color: Inspira.palette.goldSoft,
    fontWeight: "700",
  },
  selectionChipLabelAlt: {
    color: Inspira.palette.textMuted,
    fontWeight: "600",
  },
  dropdownPanel: {
    position: "absolute",
    top: 56,
    right: 0,
    zIndex: 1000,
    elevation: 20,
    minWidth: 240,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    borderRadius: Inspira.radii.md,
    padding: Inspira.spacing.md,
    gap: Inspira.spacing.sm,
    backgroundColor: Inspira.palette.bgElevated,
  },
  menuButton: {
    height: 46,
    borderRadius: Inspira.radii.md,
    borderWidth: 1,
    borderColor: Inspira.palette.borderStrong,
    backgroundColor: Inspira.palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonPressed: {
    backgroundColor: "rgba(212, 162, 76, 0.12)",
    borderColor: Inspira.palette.gold,
    transform: [{ scale: 0.995 }],
  },
  menuButtonLabel: {
    color: Inspira.palette.text,
    fontWeight: "600",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  signOutButton: {
    height: 46,
    borderRadius: Inspira.radii.md,
    borderWidth: 1,
    borderColor: Inspira.palette.danger,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  signOutButtonPressed: {
    backgroundColor: "rgba(220, 53, 69, 0.10)",
    transform: [{ scale: 0.995 }],
  },
  signOutButtonLabel: {
    color: Inspira.palette.danger,
    fontWeight: "700",
  },
  errorText: {
    marginTop: Inspira.spacing.sm,
    color: Inspira.palette.danger,
  },
  closedHint: {
    marginTop: Inspira.spacing.lg,
  },
});
