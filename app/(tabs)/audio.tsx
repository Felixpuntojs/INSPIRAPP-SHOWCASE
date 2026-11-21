import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Inspira } from "@/constants/theme";
import { loadAudioTracks, type AudioTrack } from "@/lib/audio-library";

export default function AudioLibraryScreen() {
  const router = useRouter();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const refreshLibrary = useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    setLoadError(false);

    void loadAudioTracks()
      .then((audioTracks) => {
        if (isActive) {
          setTracks(audioTracks);
        }
      })
      .catch((error) => {
        console.warn("Could not load audio library", error);
        if (isActive) {
          setLoadError(true);
          setTracks([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useFocusEffect(refreshLibrary);

  const openPlayer = (track: AudioTrack) => {
    router.push({
      pathname: "/(tabs)/audio-player",
      params: { path: track.path },
    } as never);
  };

  const people = [...new Set(tracks.map((track) => track.person))];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Volver"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={23}
              color={Inspira.palette.text}
            />
          </Pressable>
          <ThemedText type="caption" gold>
            BIBLIOTECA DE AUDIO
          </ThemedText>
          <View style={styles.topBarSpacer} />
        </View>

        <ThemedText type="title" style={styles.title}>
          Encuentra tu momento
        </ThemedText>
        <ThemedText muted style={styles.subtitle}>
          Elige una voz y un audio para escuchar.
        </ThemedText>

        {isLoading ? (
          <View style={styles.statePanel}>
            <ActivityIndicator color={Inspira.palette.gold} />
            <ThemedText muted style={styles.stateText}>
              Cargando audios...
            </ThemedText>
          </View>
        ) : loadError ? (
          <View style={styles.statePanel}>
            <Ionicons
              name="cloud-offline-outline"
              size={30}
              color={Inspira.palette.gold}
            />
            <ThemedText style={styles.stateTitle}>
              No pudimos abrir el bucket de audio
            </ThemedText>
            <ThemedText muted style={styles.stateText}>
              Revisa el acceso de lectura de AUDIOS en Supabase e inténtalo de
              nuevo.
            </ThemedText>
            <Pressable onPress={refreshLibrary} style={styles.retryButton}>
              <ThemedText gold style={styles.retryLabel}>
                Reintentar
              </ThemedText>
            </Pressable>
          </View>
        ) : tracks.length === 0 ? (
          <View style={styles.statePanel}>
            <Ionicons
              name="headset-outline"
              size={30}
              color={Inspira.palette.gold}
            />
            <ThemedText style={styles.stateTitle}>
              No hay audios visibles todavía
            </ThemedText>
            <ThemedText muted style={styles.stateText}>
              Ejecuta la política de lectura de AUDIOS en Supabase y vuelve a
              cargar esta pantalla.
            </ThemedText>
            <Pressable onPress={refreshLibrary} style={styles.retryButton}>
              <ThemedText gold style={styles.retryLabel}>
                Recargar
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          people.map((person) => {
            const personTracks = tracks.filter(
              (track) => track.person === person,
            );

            return (
              <View key={person} style={styles.personSection}>
                <ThemedText type="caption" gold style={styles.personLabel}>
                  {person}
                </ThemedText>
                {personTracks.map((track) => (
                  <Pressable
                    accessibilityLabel={`Reproducir ${track.title}`}
                    accessibilityRole="button"
                    key={track.path}
                    onPress={() => openPlayer(track)}
                    style={styles.trackRow}
                  >
                    <View style={styles.playIcon}>
                      <Ionicons
                        name="play"
                        size={15}
                        color={Inspira.palette.bg}
                      />
                    </View>
                    <View style={styles.trackCopy}>
                      <ThemedText numberOfLines={1} style={styles.trackTitle}>
                        {track.title}
                      </ThemedText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Inspira.palette.textMuted}
                    />
                  </Pressable>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
  },
  content: {
    paddingHorizontal: Inspira.spacing.lg,
    paddingTop: Inspira.spacing.md,
    paddingBottom: Inspira.spacing.xxl,
  },
  topBar: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  topBarSpacer: {
    width: 42,
  },
  title: {
    marginTop: Inspira.spacing.lg,
    fontSize: Inspira.fontSize.xxl,
  },
  subtitle: {
    marginTop: Inspira.spacing.xs,
    marginBottom: Inspira.spacing.xl,
  },
  statePanel: {
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    gap: Inspira.spacing.md,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    borderRadius: Inspira.radii.lg,
    backgroundColor: Inspira.palette.bgElevated,
    padding: Inspira.spacing.lg,
  },
  stateTitle: {
    fontSize: Inspira.fontSize.lg,
    fontWeight: "600",
    textAlign: "center",
  },
  stateText: {
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: Inspira.spacing.md,
  },
  retryLabel: {
    fontWeight: "700",
  },
  personSection: {
    marginBottom: Inspira.spacing.xl,
  },
  personLabel: {
    marginBottom: Inspira.spacing.sm,
  },
  trackRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: Inspira.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Inspira.palette.border,
    paddingVertical: Inspira.spacing.sm,
  },
  playIcon: {
    width: 34,
    height: 34,
    borderRadius: Inspira.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Inspira.palette.gold,
  },
  trackCopy: {
    flex: 1,
  },
  trackTitle: {
    fontWeight: "600",
  },
});
