import { Stack } from "expo-router";
import { DarkTheme, ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { Inspira } from "@/constants/theme";

export const unstable_settings = {
  anchor: "(auth)",
};

const InspiraNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Inspira.palette.bg,
    card: Inspira.palette.bg,
    text: Inspira.palette.text,
    primary: Inspira.palette.gold,
    border: Inspira.palette.border,
    notification: Inspira.palette.gold,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={InspiraNavigationTheme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: Inspira.palette.bg },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
