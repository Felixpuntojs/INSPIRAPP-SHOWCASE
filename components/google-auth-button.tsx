import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";

type Props = {
  label: string;
  onError?: (message: string) => void;
};

const GENERIC_ERROR = "No se pudo continuar con Google. Intenta nuevamente.";

/**
 * Botón único de Google: si el correo no tiene cuenta, Firebase la crea;
 * si ya existe, inicia sesión. El enrutado posterior (onboarding o home)
 * lo hace el listener de auth en app/(auth)/_layout.tsx.
 */
export function GoogleAuthButton({ label, onError }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (isLoading) return;

    setIsLoading(true);
    onError?.("");

    try {
      // Import diferido: el módulo es nativo y no existe en Expo Go.
      const { GoogleSignin, isErrorWithCode, statusCodes } = await import(
        "@react-native-google-signin/google-signin"
      );

      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (!webClientId) {
        onError?.("Falta configurar el acceso con Google.");
        return;
      }

      GoogleSignin.configure({ webClientId });

      try {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        const result = await GoogleSignin.signIn();

        if (result.type !== "success") {
          return; // el usuario cerró la ventana de Google
        }

        const idToken = result.data.idToken;
        if (!idToken) {
          onError?.(GENERIC_ERROR);
          return;
        }

        await signInWithCredential(
          auth,
          GoogleAuthProvider.credential(idToken),
        );
      } catch (error) {
        if (
          isErrorWithCode(error) &&
          (error.code === statusCodes.SIGN_IN_CANCELLED ||
            error.code === statusCodes.IN_PROGRESS)
        ) {
          return;
        }
        if (
          isErrorWithCode(error) &&
          error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
        ) {
          onError?.("Google Play Services no está disponible en este equipo.");
          return;
        }
        throw error;
      }
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : "";
      console.warn("Google sign-in failed", code, error);
      onError?.(code ? `${GENERIC_ERROR} (${code})` : GENERIC_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      style={[styles.button, isLoading && styles.buttonDisabled]}
      disabled={isLoading}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ThemedText style={styles.label}>
        {isLoading ? "Conectando con Google..." : label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: Inspira.spacing.sm,
    height: 48,
    borderRadius: Inspira.radii.md,
    borderWidth: 1,
    borderColor: Inspira.palette.borderStrong,
    backgroundColor: Inspira.palette.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Inspira.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: Inspira.palette.text,
    fontWeight: "600",
    letterSpacing: 0.2,
    fontSize: Inspira.fontSize.md,
  },
});
