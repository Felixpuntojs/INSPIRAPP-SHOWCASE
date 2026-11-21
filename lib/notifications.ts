import { Platform } from "react-native";

import { Inspira } from "@/constants/theme";

export const DAILY_REMINDER_CHANNEL_ID = "daily-reminder";
const NOTIFICATION_TEMPLATE_OPTIONS = [
  {
    id: "phrase-today",
    title: "¿Cuál será tu frase de hoy? 👀",
    body: "Ábrela. Tal vez llegue en el momento indicado.",
  },
  {
    id: "waiting-phrase",
    title: "Hay una frase esperándote ✨",
    body: "Descubre la inspiración de hoy.",
  },
  {
    id: "today-awaits",
    title: "La frase de hoy te espera 💭",
    body: "Abre Inspira y descúbrela.",
  },
  {
    id: "phrase-arrived",
    title: "Tu frase ya llegó 📖",
    body: "Tómate un momento para leerla.",
  },
] as const;

let notificationModulePromise: Promise<
  typeof import("expo-notifications")
> | null = null;

async function getNotificationsModule() {
  if (!notificationModulePromise) {
    notificationModulePromise = import("expo-notifications");
  }

  return notificationModulePromise;
}

function getRandomNotificationTemplate() {
  const randomIndex = Math.floor(
    Math.random() * NOTIFICATION_TEMPLATE_OPTIONS.length,
  );

  return (
    NOTIFICATION_TEMPLATE_OPTIONS[randomIndex] ??
    NOTIFICATION_TEMPLATE_OPTIONS[0]
  );
}

export async function configureNotificationHandlerAsync(): Promise<void> {
  const Notifications = await getNotificationsModule();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureDailyReminderChannelAsync(): Promise<void> {
  const Notifications = await getNotificationsModule();

  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
    name: "Recordatorio diario",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: Inspira.palette.gold,
  });
}

export async function requestNotificationPermissionAsync(): Promise<boolean> {
  const Notifications = await getNotificationsModule();

  const currentPermissions = await Notifications.getPermissionsAsync();

  if (
    currentPermissions.granted ||
    currentPermissions.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return (
    requestedPermissions.granted ||
    requestedPermissions.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function scheduleDailyReminderAsync(
  hour: number,
  minute: number,
): Promise<string> {
  const Notifications = await getNotificationsModule();
  const template = getRandomNotificationTemplate();

  await Notifications.cancelAllScheduledNotificationsAsync();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: template.title,
      body: template.body,
      data: {
        url: "/(tabs)",
        screen: "/(tabs)",
      },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: DAILY_REMINDER_CHANNEL_ID,
    },
  });
}

export async function clearDailyRemindersAsync(): Promise<void> {
  const Notifications = await getNotificationsModule();

  await Notifications.cancelAllScheduledNotificationsAsync();
}
