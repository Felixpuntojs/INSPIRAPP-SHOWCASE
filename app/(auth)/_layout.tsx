import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import { getUserProfile, upsertUserProfile } from "@/lib/user-profile";

function getProviderName(): "google" | "password" {
  const hasGoogle = auth.currentUser?.providerData.some(
    (providerData) => providerData.providerId === "google.com",
  );

  return hasGoogle ? "google" : "password";
}

export default function AuthLayout() {
  const router = useRouter();
  const [isRouting, setIsRouting] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) {
        return;
      }

      if (!user) {
        setIsRouting(false);
        return;
      }

      const profile = await getUserProfile(user.uid);

      if (!isMounted) {
        return;
      }

      if (profile?.onboardingCompleted) {
        router.replace("/(tabs)");
      } else {
        if (!profile) {
          void upsertUserProfile(user, getProviderName());
        }

        if (!profile?.categories?.length) {
          router.replace("/(auth)/onboarding-categories");
        } else if (!profile?.masterMinds?.length) {
          router.replace("/(auth)/onboarding-master-minds");
        } else if (!profile?.notificationsEnabled) {
          router.replace("/(auth)/onboarding-notification-time");
        } else {
          router.replace("/(tabs)");
        }
      }

      setIsRouting(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  if (isRouting) {
    return (
      <View style={styles.loadingRoot}>
        <ThemedText muted>Preparando tu espacio...</ThemedText>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Inspira.palette.bg },
        animation: "fade",
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
