import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import {
    clearDailyRemindersAsync,
    configureNotificationHandlerAsync,
    ensureDailyReminderChannelAsync,
    requestNotificationPermissionAsync,
    scheduleDailyReminderAsync,
} from "@/lib/notifications";
import {
    getUserProfile,
    saveUserNotificationSettings,
} from "@/lib/user-profile";
import { useRouter } from "expo-router";

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);
const PERIOD_OPTIONS = ["a.m.", "p.m."] as const;
const PICKER_HEIGHT = 180;

function to12HourParts(hour24: number) {
  const period = hour24 >= 12 ? "p.m." : "a.m.";
  const normalizedHour = hour24 % 12 || 12;

  return {
    hour12: normalizedHour,
    period,
  } as const;
}

function to24Hour(hour12: number, period: (typeof PERIOD_OPTIONS)[number]) {
  if (period === "a.m.") {
    return hour12 === 12 ? 0 : hour12;
  }

  return hour12 === 12 ? 12 : hour12 + 12;
}

function formatClockValue(value: number): string {
  return String(value).padStart(2, "0");
}

function formatSelectedTime(
  hour12: number,
  minute: number,
  period: (typeof PERIOD_OPTIONS)[number],
): string {
  return `${hour12}:${formatClockValue(minute)} ${period}`;
}

type WheelPickerProps = {
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

function WheelPicker({ value, onIncrement, onDecrement }: WheelPickerProps) {
  return (
    <View style={styles.stepperColumn}>
      <Pressable onPress={onIncrement} style={styles.stepperButton}>
        <MaterialIcons
          name="keyboard-arrow-up"
          size={24}
          color={Inspira.palette.textMuted}
        />
      </Pressable>
      <View style={styles.stepperValueWrap}>
        <ThemedText style={styles.stepperValue}>{value}</ThemedText>
      </View>
      <Pressable onPress={onDecrement} style={styles.stepperButton}>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={24}
          color={Inspira.palette.textMuted}
        />
      </Pressable>
    </View>
  );
}

export default function NotificationTimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initialTime = to12HourParts(8);
  const [selectedHour, setSelectedHour] = useState(initialTime.hour12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<
    (typeof PERIOD_OPTIONS)[number]
  >(initialTime.period);
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

      if (typeof profile?.notificationHour === "number") {
        const savedTime = to12HourParts(profile.notificationHour);
        setSelectedHour(savedTime.hour12);
        setSelectedPeriod(savedTime.period);
      }

      if (typeof profile?.notificationMinute === "number") {
        setSelectedMinute(profile.notificationMinute);
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

  const selectedHour24 = useMemo(
    () => to24Hour(selectedHour, selectedPeriod),
    [selectedHour, selectedPeriod],
  );

  const selectionLabel = useMemo(
    () =>
      `Recibirás tu notificación todos los días a las ${formatSelectedTime(selectedHour, selectedMinute, selectedPeriod)}`,
    [selectedHour, selectedMinute, selectedPeriod],
  );

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || isSaving) {
      return;
    }

    setErrorMessage("");
    try {
      setIsSaving(true);
      await configureNotificationHandlerAsync();
      await ensureDailyReminderChannelAsync();
      const permissionGranted = await requestNotificationPermissionAsync();

      if (permissionGranted) {
        await clearDailyRemindersAsync();
        await scheduleDailyReminderAsync(selectedHour24, selectedMinute);
      }

      const wasSaved = await saveUserNotificationSettings(
        user.uid,
        selectedHour24,
        selectedMinute,
        permissionGranted,
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
        "No se pudo configurar la notificación. Intenta nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipForNow = async () => {
    const user = auth.currentUser;
    if (!user || isSaving) {
      return;
    }

    setErrorMessage("");
    try {
      setIsSaving(true);
      const wasSaved = await saveUserNotificationSettings(
        user.uid,
        selectedHour24,
        selectedMinute,
        false,
      );

      if (!wasSaved) {
        setErrorMessage(
          "No se pudo guardar por permisos de Firebase. Revisa reglas de Firestore.",
        );
        return;
      }

      router.back();
    } catch {
      setErrorMessage("No se pudo omitir la alarma por ahora.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ThemedText muted>Cargando recordatorio...</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.contentBlock}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons
              name="arrow-back-ios-new"
              size={22}
              color={Inspira.palette.text}
            />
          </Pressable>
          <ThemedText type="title" style={styles.topBarTitle}>
            Hora de notificación
          </ThemedText>
        </View>

        <ThemedText muted style={styles.subtitle}>
          Ajusta la hora de tu recordatorio diario
        </ThemedText>

        <View style={styles.previewCard}>
          <MaterialIcons
            name="notifications-active"
            size={22}
            color={Inspira.palette.gold}
          />
          <ThemedText style={styles.previewTime}>
            {formatSelectedTime(selectedHour, selectedMinute, selectedPeriod)}
          </ThemedText>
          <ThemedText muted style={styles.previewLabel}>
            {selectionLabel}
          </ThemedText>
          <View style={styles.pickerShell}>
            <WheelPicker
              value={String(selectedHour)}
              onIncrement={() =>
                setSelectedHour((current) =>
                  current === HOUR_OPTIONS[HOUR_OPTIONS.length - 1]
                    ? HOUR_OPTIONS[0]
                    : current + 1,
                )
              }
              onDecrement={() =>
                setSelectedHour((current) =>
                  current === HOUR_OPTIONS[0]
                    ? HOUR_OPTIONS[HOUR_OPTIONS.length - 1]
                    : current - 1,
                )
              }
            />
            <WheelPicker
              value={formatClockValue(selectedMinute)}
              onIncrement={() =>
                setSelectedMinute((current) =>
                  current === MINUTE_OPTIONS[MINUTE_OPTIONS.length - 1]
                    ? MINUTE_OPTIONS[0]
                    : current + 1,
                )
              }
              onDecrement={() =>
                setSelectedMinute((current) =>
                  current === MINUTE_OPTIONS[0]
                    ? MINUTE_OPTIONS[MINUTE_OPTIONS.length - 1]
                    : current - 1,
                )
              }
            />
            <WheelPicker
              value={selectedPeriod}
              onIncrement={() =>
                setSelectedPeriod((current) =>
                  current === PERIOD_OPTIONS[0]
                    ? PERIOD_OPTIONS[1]
                    : PERIOD_OPTIONS[0],
                )
              }
              onDecrement={() =>
                setSelectedPeriod((current) =>
                  current === PERIOD_OPTIONS[0]
                    ? PERIOD_OPTIONS[1]
                    : PERIOD_OPTIONS[0],
                )
              }
            />
          </View>
        </View>

        {errorMessage ? (
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}
      </View>

      <View
        style={[
          styles.buttonStack,
          { marginBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={[
            styles.finishButton,
            isSaving ? styles.disabledButton : undefined,
          ]}
        >
          <ThemedText style={styles.finishLabel}>
            {isSaving ? "Guardando..." : "Guardar notificación"}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleSkipForNow}
          disabled={isSaving}
          style={[
            styles.skipButton,
            isSaving ? styles.disabledButton : undefined,
          ]}
        >
          <ThemedText style={styles.skipLabel}>Saltar por ahora</ThemedText>
        </Pressable>
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
  loadingRoot: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  contentBlock: {
    flex: 1,
    paddingTop: 32,
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
  topBarTitle: {
    flex: 1,
  },
  subtitle: {
    marginTop: Inspira.spacing.md,
  },
  previewCard: {
    marginTop: Inspira.spacing.lg,
    borderRadius: Inspira.radii.lg,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: Inspira.palette.bgElevated,
    padding: Inspira.spacing.lg,
    alignItems: "center",
    gap: 6,
  },
  previewTime: {
    fontSize: 36,
    lineHeight: 42,
    color: Inspira.palette.text,
    fontWeight: "700",
  },
  previewLabel: {
    textAlign: "center",
  },
  pickerShell: {
    marginTop: Inspira.spacing.lg,
    height: PICKER_HEIGHT,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    flexDirection: "row",
    overflow: "hidden",
    paddingHorizontal: Inspira.spacing.sm,
  },
  stepperColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Inspira.spacing.md,
  },
  stepperButton: {
    width: 44,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  stepperValueWrap: {
    minWidth: 76,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    color: Inspira.palette.text,
    fontSize: 30,
    fontWeight: "700",
  },
  buttonStack: {
    gap: Inspira.spacing.sm,
    marginTop: Inspira.spacing.md,
  },
  finishButton: {
    height: 52,
    borderRadius: Inspira.radii.pill,
    backgroundColor: Inspira.palette.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    height: 44,
    borderRadius: Inspira.radii.pill,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.45,
  },
  finishLabel: {
    color: "#22180A",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  skipLabel: {
    color: Inspira.palette.text,
    fontWeight: "600",
  },
  errorText: {
    color: Inspira.palette.danger,
    marginTop: Inspira.spacing.md,
  },
});
