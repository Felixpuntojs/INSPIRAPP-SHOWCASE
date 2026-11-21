import { User } from "firebase/auth";

import { supabase } from "@/lib/supabase";

type ProviderName = "google" | "password";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: ProviderName;
  categories?: string[];
  masterMinds?: string[];
  notificationHour?: number;
  notificationMinute?: number;
  notificationsEnabled?: boolean;
  onboardingCompleted?: boolean;
};

function mapUserRow(row: Record<string, any> | null): UserProfile | null {
  if (!row) {
    return null;
  }

  return {
    uid: String(row.uid ?? ""),
    email: String(row.email ?? ""),
    displayName: String(row.display_name ?? row.displayName ?? ""),
    photoURL: String(row.photo_url ?? row.photoURL ?? ""),
    provider: (row.provider ?? "password") as ProviderName,
    categories: Array.isArray(row.categories) ? row.categories : [],
    masterMinds: Array.isArray(row.master_minds) ? row.master_minds : [],
    notificationHour:
      typeof row.notification_hour === "number"
        ? row.notification_hour
        : undefined,
    notificationMinute:
      typeof row.notification_minute === "number"
        ? row.notification_minute
        : undefined,
    notificationsEnabled:
      typeof row.notifications_enabled === "boolean"
        ? row.notifications_enabled
        : undefined,
    onboardingCompleted:
      typeof row.onboarding_completed === "boolean"
        ? row.onboarding_completed
        : undefined,
  };
}

export async function upsertUserProfile(
  user: User,
  provider: ProviderName,
  displayNameOverride?: string,
): Promise<void> {
  try {
    const displayName = (displayNameOverride ?? user.displayName ?? "").trim();
    const now = new Date().toISOString();
    const profileUpdates = {
      email: user.email ?? "",
      provider,
      last_login_at: now,
      updated_at: now,
      ...(displayName ? { display_name: displayName } : {}),
      ...(user.photoURL ? { photo_url: user.photoURL } : {}),
    };

    const { error: insertError } = await supabase.from("users").insert({
      uid: user.uid,
      ...profileUpdates,
      categories: [],
      master_minds: [],
      notifications_enabled: false,
      onboarding_completed: false,
    });

    if (insertError?.code === "23505") {
      const { error: updateError } = await supabase
        .from("users")
        .update(profileUpdates)
        .eq("uid", user.uid);

      if (updateError) {
        throw updateError;
      }
    } else if (insertError) {
      throw insertError;
    }
  } catch (error) {
    console.warn("Could not upsert user profile", JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("uid", uid)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return mapUserRow(data);
  } catch (error) {
    console.warn("Could not load user profile", JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
    return null;
  }
}

export async function saveUserCategories(
  uid: string,
  categories: string[],
  markOnboardingCompleted: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").upsert(
      {
        uid,
        categories,
        onboarding_completed: markOnboardingCompleted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "uid" },
    );

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.warn("Could not save user categories", JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
    return false;
  }
}

export async function saveUserMasterMinds(
  uid: string,
  masterMinds: string[],
  markOnboardingCompleted: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").upsert(
      {
        uid,
        master_minds: masterMinds,
        onboarding_completed: markOnboardingCompleted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "uid" },
    );

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.warn("Could not save user master minds", JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
    return false;
  }
}

export async function saveUserNotificationSettings(
  uid: string,
  notificationHour: number,
  notificationMinute: number,
  notificationsEnabled: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").upsert(
      {
        uid,
        notification_hour: notificationHour,
        notification_minute: notificationMinute,
        notifications_enabled: notificationsEnabled,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "uid" },
    );

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.warn("Could not save notification settings", JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
    return false;
  }
}
