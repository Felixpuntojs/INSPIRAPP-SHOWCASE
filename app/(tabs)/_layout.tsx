import { Stack } from "expo-router";

import { Inspira } from "@/constants/theme";

// La barra de pestañas estaba oculta y todas las pantallas se abren por
// navegación manual (router.push), así que un Stack es más simple y estable
// que Tabs con pantallas `href: null`.
export default function TabLayout() {
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
