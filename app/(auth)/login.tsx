import { GoogleAuthButton } from "@/components/google-auth-button";
import { InspiraLogo } from "@/components/inspira-logo";
import { ThemedText } from "@/components/themed-text";
import { Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import { getUserProfile, upsertUserProfile } from "@/lib/user-profile";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canContinue =
    email.trim().length > 5 && password.length >= 6 && !isLoading;

  function mapAuthError(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return "No se pudo iniciar sesión. Intenta nuevamente.";
    }

    switch (error.code) {
      case "auth/invalid-email":
        return "El email no tiene un formato válido.";
      case "auth/user-disabled":
        return "Esta cuenta está deshabilitada.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Email o contraseña incorrectos.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Espera unos minutos.";
      default:
        return "No se pudo iniciar sesión. Intenta nuevamente.";
    }
  }

  const handleLogin = async () => {
    if (!canContinue) return;

    setErrorMessage("");
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const profile = await getUserProfile(credential.user.uid);

      if (profile?.onboardingCompleted) {
        router.replace("/(tabs)");
      } else {
        if (!profile) {
          void upsertUserProfile(credential.user, "password");
        }
        router.replace("/(auth)/onboarding-categories");
      }
    } catch (error) {
      setErrorMessage(mapAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <InspiraLogo
        size="sm"
        style={styles.logo}
        wordmarkStyle={styles.logoWordmark}
      />

      <View style={styles.formCard}>
        <TextInput
          placeholder="Email"
          placeholderTextColor={Inspira.palette.textDim}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor={Inspira.palette.textDim}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {errorMessage ? (
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}

        <Pressable
          style={[styles.cta, !canContinue ? styles.ctaDisabled : undefined]}
          disabled={!canContinue}
          onPress={handleLogin}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          <ThemedText style={styles.ctaLabel}>
            {isLoading ? "Ingresando..." : "Iniciar sesión"}
          </ThemedText>
        </Pressable>
        <GoogleAuthButton
          label="Iniciar sesión con Google"
          onError={setErrorMessage}
        />
      </View>

      <Link href="/register" asChild>
        <ThemedText type="link" style={styles.link}>
          ¿No tienes cuenta? Crear cuenta
        </ThemedText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Inspira.palette.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Inspira.spacing.xl,
  },
  glowTop: {
    position: "absolute",
    top: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Inspira.palette.gold,
    opacity: 0.04,
  },
  glowBottom: {
    position: "absolute",
    bottom: -200,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: Inspira.palette.gold,
    opacity: 0.03,
  },
  logo: {
    transform: [{ translateY: -40 }],
  },
  logoWordmark: {
    marginTop: 2,
  },
  title: {
    marginTop: Inspira.spacing.lg,
  },
  subtitle: {
    textAlign: "center",
    marginTop: Inspira.spacing.sm,
    marginBottom: Inspira.spacing.lg,
  },
  formCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Inspira.radii.lg,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: Inspira.palette.bgElevated,
    padding: Inspira.spacing.md,
    gap: Inspira.spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: Inspira.radii.md,
    borderWidth: 1,
    borderColor: Inspira.palette.borderStrong,
    backgroundColor: Inspira.palette.surface,
    color: Inspira.palette.text,
    paddingHorizontal: Inspira.spacing.md,
    fontSize: Inspira.fontSize.md,
  },
  errorText: {
    color: Inspira.palette.danger,
    marginTop: 2,
  },
  cta: {
    marginTop: Inspira.spacing.sm,
    height: 48,
    borderRadius: Inspira.radii.md,
    backgroundColor: Inspira.palette.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaLabel: {
    color: "#22180A",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  ctaSecondary: {
    marginTop: Inspira.spacing.xs,
    height: 48,
    borderRadius: Inspira.radii.md,
    borderWidth: 1,
    borderColor: Inspira.palette.borderStrong,
    backgroundColor: Inspira.palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaSecondaryLabel: {
    color: Inspira.palette.text,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  debugCard: {
    marginTop: Inspira.spacing.sm,
    borderRadius: Inspira.radii.md,
    borderWidth: 1,
    borderColor: Inspira.palette.border,
    backgroundColor: Inspira.palette.surface,
    padding: Inspira.spacing.sm,
    gap: 6,
  },
  debugTitle: {
    fontSize: Inspira.fontSize.sm,
    color: Inspira.palette.gold,
    fontWeight: "600",
  },
  debugUri: {
    fontSize: Inspira.fontSize.xs,
    lineHeight: 18,
  },
  debugHelp: {
    fontSize: Inspira.fontSize.xs,
    lineHeight: 16,
  },
  link: {
    marginTop: Inspira.spacing.lg,
  },
});
