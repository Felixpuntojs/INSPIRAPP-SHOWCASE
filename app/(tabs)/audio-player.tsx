import { Ionicons } from "@expo/vector-icons";
import {
    setAudioModeAsync,
    useAudioPlayer,
    useAudioPlayerStatus,
} from "expo-audio";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
    type GestureResponderEvent,
} from "react-native";
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Fonts, Inspira } from "@/constants/theme";
import {
    createAudioUrl,
    loadAudioTracks,
    type AudioTrack,
} from "@/lib/audio-library";

const WAVEFORM = [
  18, 26, 34, 20, 42, 54, 30, 64, 44, 72, 38, 58, 82, 48, 68, 92, 55, 76, 44,
  66, 36, 86, 52, 70, 40, 62, 32, 48, 24, 38, 18,
];

function AnimatedWaveBar({
  height,
  index,
  playing,
}: {
  height: number;
  index: number;
  playing: boolean;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pulse);

    if (playing) {
      pulse.value = withDelay(
        (index % 8) * 75,
        withRepeat(
          withSequence(
            withTiming(1, {
              duration: 300 + (index % 4) * 70,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0, {
              duration: 360 + (index % 3) * 80,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          false,
        ),
      );
    } else {
      pulse.value = withTiming(0, { duration: 220 });
    }

    return () => cancelAnimation(pulse);
  }, [index, playing, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.58 + pulse.value * 0.42,
    transform: [{ scaleY: 0.62 + pulse.value * 0.62 }],
  }));

  return (
    <Animated.View
      style={[
        styles.artworkBar,
        { height, opacity: index % 4 === 0 ? 0.95 : 0.65 },
        animatedStyle,
      ]}
    />
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export default function AudioPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    path?: string | string[];
    single?: string | string[];
  }>();
  const audioPath = Array.isArray(params.path) ? params.path[0] : params.path;
  const singleMode = Array.isArray(params.single)
    ? params.single[0] === "true"
    : params.single === "true";
  const player = useAudioPlayer(null, { updateInterval: 300 });
  const status = useAudioPlayerStatus(player);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [progressWidth, setProgressWidth] = useState(1);

  useFocusEffect(
    useCallback(() => {
      return () => player.pause();
    }, [player]),
  );

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
    });
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadTrack() {
      setIsLoading(true);
      setLoadError(false);
      setTrack(null);

      try {
        if (!audioPath) {
          throw new Error("Falta la ruta del audio.");
        }

        const audioTracks = await loadAudioTracks();
        if (!isActive) {
          return;
        }
        setTracks(audioTracks);

        const selectedTrack = audioTracks.find(
          (item) => item.path === audioPath,
        );
        if (!selectedTrack) {
          throw new Error("El audio no está visible para la aplicación.");
        }

        const signedUrl = await createAudioUrl(selectedTrack.path);
        if (!isActive) {
          return;
        }

        setTrack(selectedTrack);
        player.replace(signedUrl);
      } catch (error) {
        console.warn("Could not open audio", error);
        if (isActive) {
          setLoadError(true);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadTrack();
    return () => {
      isActive = false;
    };
  }, [audioPath, player]);

  useEffect(() => {
    if (status.didJustFinish) {
      void player.seekTo(0);
    }
  }, [player, status.didJustFinish]);

  const trackIndex = tracks.findIndex((item) => item.path === audioPath);
  const progress =
    status.duration > 0
      ? Math.min(1, Math.max(0, status.currentTime / status.duration))
      : 0;

  const playAdjacentTrack = (direction: -1 | 1) => {
    const nextTrack = tracks[trackIndex + direction];
    if (nextTrack) {
      router.replace({
        pathname: "/(tabs)/audio-player",
        params: { path: nextTrack.path },
      } as never);
    }
  };

  const handleSeek = (event: GestureResponderEvent) => {
    if (status.duration <= 0 || progressWidth <= 0) {
      return;
    }

    const fraction = Math.min(
      1,
      Math.max(0, event.nativeEvent.locationX / progressWidth),
    );
    void player.seekTo(fraction * status.duration);
  };

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
      return;
    }

    if (status.didJustFinish || status.currentTime >= status.duration) {
      void player.seekTo(0).then(() => player.play());
      return;
    }

    player.play();
  };

  const canSkipBackward = !singleMode && trackIndex > 0;
  const canSkipForward =
    !singleMode && trackIndex >= 0 && trackIndex < tracks.length - 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Volver a la biblioteca"
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
            REPRODUCIENDO
          </ThemedText>
          <View style={styles.activeBadge}>
            <Ionicons name="headset" size={14} color={Inspira.palette.gold} />
            <ThemedText style={styles.activeLabel}>AUDIO</ThemedText>
          </View>
        </View>

        <View style={styles.artwork}>
          <ThemedText type="caption" muted style={styles.artworkLabel}>
            INSPIRAPP AUDIO
          </ThemedText>
          <View style={styles.artworkWave}>
            {WAVEFORM.map((height, index) => (
              <AnimatedWaveBar
                key={`art-${index}`}
                height={height}
                index={index}
                playing={status.playing}
              />
            ))}
          </View>
        </View>

        <View style={styles.trackInfo}>
          <ThemedText numberOfLines={2} style={styles.trackTitle}>
            {track?.title ?? (isLoading ? "Cargando audio" : "Audio")}
          </ThemedText>
          <ThemedText gold style={styles.voiceLabel}>
            {track ? `Voz de ${track.voice}` : ""}
          </ThemedText>
        </View>

        <View style={styles.playerControls}>
          <View style={styles.waveformHeader}>
            <ThemedText type="caption" muted>
              {isLoading ? "PREPARANDO AUDIO" : "TU MOMENTO"}
            </ThemedText>
            {isLoading ? (
              <ActivityIndicator size="small" color={Inspira.palette.gold} />
            ) : null}
          </View>
          <Pressable
            accessibilityLabel="Mover posición del audio"
            accessibilityRole="adjustable"
            disabled={isLoading || !status.isLoaded}
            onLayout={(event) =>
              setProgressWidth(event.nativeEvent.layout.width)
            }
            onPress={handleSeek}
            style={styles.seekTrack}
          >
            <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
          </Pressable>
          <View style={styles.timeRow}>
            <ThemedText muted style={styles.timeLabel}>
              {formatTime(status.currentTime)}
            </ThemedText>
            <ThemedText muted style={styles.timeLabel}>
              {formatTime(status.duration)}
            </ThemedText>
          </View>

          {loadError ? (
            <ThemedText style={styles.errorText}>
              No se pudo cargar el audio. Revisa el acceso de lectura al bucket
              AUDIOS en Supabase.
            </ThemedText>
          ) : null}

          <View style={styles.controlsRow}>
            {!singleMode ? (
              <Pressable
                accessibilityLabel="Audio anterior"
                accessibilityRole="button"
                disabled={!canSkipBackward || isLoading}
                onPress={() => playAdjacentTrack(-1)}
                style={styles.skipButton}
              >
                <Ionicons
                  name="play-skip-back"
                  size={25}
                  color={
                    canSkipBackward
                      ? Inspira.palette.textMuted
                      : Inspira.palette.textDim
                  }
                />
              </Pressable>
            ) : (
              <View style={styles.skipSpacer} />
            )}
            <Pressable
              accessibilityLabel={status.playing ? "Pausar" : "Reproducir"}
              accessibilityRole="button"
              disabled={isLoading || loadError || !track}
              onPress={togglePlayback}
              style={styles.playButton}
            >
              <Ionicons
                name={status.playing ? "pause" : "play"}
                size={28}
                color={Inspira.palette.bg}
                style={!status.playing ? styles.playIconOffset : undefined}
              />
            </Pressable>
            {!singleMode ? (
              <Pressable
                accessibilityLabel="Siguiente audio"
                accessibilityRole="button"
                disabled={!canSkipForward || isLoading}
                onPress={() => playAdjacentTrack(1)}
                style={styles.skipButton}
              >
                <Ionicons
                  name="play-skip-forward"
                  size={25}
                  color={
                    canSkipForward
                      ? Inspira.palette.textMuted
                      : Inspira.palette.textDim
                  }
                />
              </Pressable>
            ) : (
              <View style={styles.skipSpacer} />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
  },
  screen: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: Inspira.spacing.lg,
    paddingBottom: Inspira.spacing.md,
  },
  topBar: {
    minHeight: 44,
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
  activeBadge: {
    minWidth: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  activeLabel: {
    color: Inspira.palette.textMuted,
    fontSize: Inspira.fontSize.xs,
  },
  artwork: {
    width: "100%",
    maxWidth: 360,
    aspectRatio: 1.05,
    alignSelf: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Inspira.palette.borderStrong,
    borderRadius: Inspira.radii.lg,
    backgroundColor: Inspira.palette.bgElevated,
    padding: Inspira.spacing.lg,
  },
  artworkLabel: {
    fontSize: 10,
  },
  artworkWave: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  artworkBar: {
    width: 4,
    borderRadius: Inspira.radii.pill,
    backgroundColor: Inspira.palette.gold,
  },
  trackInfo: {
    alignItems: "center",
    gap: Inspira.spacing.xs,
    paddingTop: Inspira.spacing.sm,
  },
  trackTitle: {
    maxWidth: "100%",
    fontFamily: Fonts.serif,
    fontSize: Inspira.fontSize.xl,
    lineHeight: 29,
    textAlign: "center",
  },
  voiceLabel: {
    fontSize: Inspira.fontSize.sm,
  },
  playerControls: {
    gap: Inspira.spacing.sm,
  },
  waveformHeader: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seekTrack: {
    height: 4,
    overflow: "hidden",
    borderRadius: Inspira.radii.pill,
    backgroundColor: Inspira.palette.surfaceHigh,
  },
  seekFill: {
    height: "100%",
    borderRadius: Inspira.radii.pill,
    backgroundColor: Inspira.palette.gold,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeLabel: {
    fontSize: Inspira.fontSize.xs,
    fontVariant: ["tabular-nums"],
  },
  errorText: {
    color: Inspira.palette.danger,
    fontSize: Inspira.fontSize.xs,
    lineHeight: 18,
    textAlign: "center",
  },
  controlsRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Inspira.spacing.xxl,
  },
  skipButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  skipSpacer: {
    width: 48,
    height: 48,
  },
  playButton: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Inspira.radii.pill,
    backgroundColor: Inspira.palette.gold,
  },
  playIconOffset: {
    marginLeft: 3,
  },
});
