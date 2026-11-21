import { Link } from "expo-router";

import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { GoogleAuthButton } from "@/components/google-auth-button";
import { InspiraLogo } from "@/components/inspira-logo";
import { ThemedText } from "@/components/themed-text";
import { Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import { upsertUserProfile } from "@/lib/user-profile";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canContinue =
    name.trim().length > 1 &&
    email.trim().length > 5 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    !isLoading;

  function mapRegisterError(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return "No se pudo crear la cuenta. Intenta nuevamente.";
    }

    switch (error.code) {
      case "auth/invalid-email":
        return "El email no tiene un formato válido.";
      case "auth/email-already-in-use":
        return "Este email ya está registrado.";
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Espera unos minutos.";
      default:
        return "No se pudo crear la cuenta. Intenta nuevamente.";
    }
  }

  const handleRegister = async () => {
    if (!canContinue) return;

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      try {
        await updateProfile(credential.user, { displayName: name.trim() });
      } catch (error) {
        console.warn("Could not save Firebase display name", error);
      }
      await upsertUserProfile(credential.user, "password", name.trim());
    } catch (error) {
      setErrorMessage(mapRegisterError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <InspiraLogo size="sm" wordmarkStyle={styles.logoWordmark} />

      <ThemedText muted style={styles.subtitle}>
        Comienza tu viaje de crecimiento consciente
      </ThemedText>

      <View style={styles.formCard}>
        <TextInput
          placeholder="Nombre completo"
          placeholderTextColor={Inspira.palette.textDim}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
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
        <TextInput
          placeholder="Confirmar contraseña"
          placeholderTextColor={Inspira.palette.textDim}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />

        {errorMessage ? (
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}

        <Pressable
          style={[styles.cta, !canContinue ? styles.ctaDisabled : undefined]}
          disabled={!canContinue}
          onPress={handleRegister}
          accessibilityRole="button"
          accessibilityLabel="Crear cuenta"
        >
          <ThemedText style={styles.ctaLabel}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </ThemedText>
        </Pressable>
        <GoogleAuthButton
          label="Crear cuenta con Google"
          onError={setErrorMessage}
        />
      </View>

      <Link href="/login" replace asChild>
        <ThemedText type="link" style={styles.link}>
          ¿Ya tienes cuenta? Iniciar sesión
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
  link: {
    marginTop: Inspira.spacing.lg,
  },
});
