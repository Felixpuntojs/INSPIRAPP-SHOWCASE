import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/lib/user-profile";

export type PhraseRecord = {
  id: string;
  phrase: string;
  category: string;
  masterMindName: string;
  masterMindRole: string;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanMasterMindRole(role: unknown): string {
  return String(role ?? "")
    .replace(/\s*;\s*frases editoriales,?\s*no citas textuales\.?/i, "")
    .trim();
}

const accentInsensitiveCollator = new Intl.Collator("es", {
  usage: "search",
  sensitivity: "base",
});

function getStringField(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getFieldByNormalizedKey(
  data: Record<string, unknown>,
  targetKey: string,
): unknown {
  const normalizedTargetKey = normalizeText(targetKey);

  for (const [key, value] of Object.entries(data)) {
    if (normalizeText(key) === normalizedTargetKey) {
      return value;
    }
  }

  return undefined;
}

function getCategoriesFromPhraseData(data: Record<string, unknown>): string[] {
  const rawCategoryValue =
    getFieldByNormalizedKey(data, "categoria") ??
    getFieldByNormalizedKey(data, "categoría") ??
    getFieldByNormalizedKey(data, "category");

  if (typeof rawCategoryValue === "string" && rawCategoryValue.trim()) {
    return [rawCategoryValue.trim()];
  }

  if (Array.isArray(rawCategoryValue)) {
    return rawCategoryValue
      .flatMap((item) => {
        if (typeof item === "string") {
          return [item.trim()];
        }

        if (item && typeof item === "object") {
          const objectValue = item as Record<string, unknown>;
          const nestedCategory = getStringField(objectValue, [
            "Nombre",
            "nombre",
            "name",
            "categoria",
            "Categoria",
            "categoría",
            "Category",
            "category",
            "label",
            "value",
            "text",
          ]);

          return nestedCategory ? [nestedCategory] : [];
        }

        return [];
      })
      .filter(Boolean);
  }

  return [];
}

function getStringArrayField(
  data: Record<string, unknown>,
  keys: string[],
): string[] {
  for (const key of keys) {
    const value = data[key];

    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }

    if (Array.isArray(value)) {
      const strings = value
        .flatMap((item) => {
          if (typeof item === "string") {
            return [item.trim()];
          }

          if (item && typeof item === "object") {
            const objectValue = item as Record<string, unknown>;
            const candidate = getStringField(objectValue, [
              "Nombre",
              "nombre",
              "name",
              "categoria",
              "Categoria",
              "category",
              "label",
              "value",
              "text",
            ]);

            return candidate ? [candidate] : [];
          }

          return [];
        })
        .filter(Boolean);

      if (strings.length) {
        return strings;
      }
    }
  }

  return [];
}

function uniqueValues(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function matchesSelection(value: string, selectedValues: string[]): boolean {
  const normalizedValue = normalizeText(value);

  return selectedValues.some(
    (selectedValue) => normalizeText(selectedValue) === normalizedValue,
  );
}

function matchesAnySelection(
  values: string[],
  selectedValues: string[],
): boolean {
  return values.some((value) => matchesSelection(value, selectedValues));
}

function shufflePhrases<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function extractFirstName(
  displayName?: string | null,
  email?: string | null,
): string {
  const normalizedDisplayName = displayName?.trim();
  const fallbackName =
    (normalizedDisplayName && !normalizedDisplayName.includes("@")
      ? normalizedDisplayName
      : "") ||
    email?.split("@")[0]?.replace(/[._-]/g, " ") ||
    "Inspira";
  const firstName = fallbackName.split(/\s+/).find(Boolean) ?? "Inspira";

  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

export function pickRandomPhrase(
  phrases: PhraseRecord[],
  excludeId?: string,
): PhraseRecord | null {
  const candidates = excludeId
    ? phrases.filter((phrase) => phrase.id !== excludeId)
    : phrases;

  if (!candidates.length) {
    return phrases[0] ?? null;
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex] ?? null;
}

export function createDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function pickDailyPhrase(
  phrases: PhraseRecord[],
  seed: string,
): PhraseRecord | null {
  if (!phrases.length) {
    return null;
  }

  const hash = Array.from(seed).reduce((accumulator, character) => {
    return (accumulator * 31 + character.charCodeAt(0)) >>> 0;
  }, 0);

  const dailyIndex = hash % phrases.length;
  return phrases[dailyIndex] ?? phrases[0] ?? null;
}

export async function loadPhrasesForUserProfile(
  profile: Pick<UserProfile, "categories" | "masterMinds">,
): Promise<PhraseRecord[]> {
  const selectedCategories = uniqueValues(profile.categories ?? []);
  const selectedMasterMinds = uniqueValues(profile.masterMinds ?? []);

  if (!selectedCategories.length && !selectedMasterMinds.length) {
    return [];
  }

  try {
    const { data: masterMinds, error: masterMindsError } = await supabase
      .from("master_minds")
      .select("*");

    if (masterMindsError) {
      throw masterMindsError;
    }

    const candidateMasterMinds = (masterMinds ?? []).filter((masterMind) => {
      const masterMindName = String(masterMind.name ?? "");
      return (
        !selectedMasterMinds.length ||
        matchesAnySelection([masterMindName], selectedMasterMinds)
      );
    });

    const phraseGroups = await Promise.all(
      candidateMasterMinds.map(async (masterMind) => {
        const masterMindId = String(masterMind.id ?? "");
        const masterMindName = String(masterMind.name ?? "");
        const masterMindRole = cleanMasterMindRole(masterMind.role);

        const { data: phraseRows, error: phrasesError } = await supabase
          .from("phrases")
          .select("*")
          .eq("master_mind_id", masterMindId);

        if (phrasesError) {
          throw phrasesError;
        }

        return (phraseRows ?? [])
          .map((phraseRow) => {
            const phraseText = getStringField({ text: phraseRow.text }, [
              "text",
              "frase",
              "Frase",
            ]);
            const categories = Array.isArray(phraseRow.categories)
              ? phraseRow.categories.filter(
                  (value: unknown): value is string =>
                    typeof value === "string",
                )
              : [];

            if (!phraseText) {
              return null;
            }

            if (
              selectedCategories.length &&
              !matchesAnySelection(categories, selectedCategories)
            ) {
              return null;
            }

            return {
              id: `${masterMindId}:${String(phraseRow.id ?? "")}`,
              phrase: phraseText,
              category: categories.join(" · ") || "Sin categoría",
              masterMindName,
              masterMindRole,
            } satisfies PhraseRecord;
          })
          .filter((item): item is PhraseRecord => Boolean(item));
      }),
    );

    const matchedPhrases = phraseGroups.flat();
    if (matchedPhrases.length) {
      return matchedPhrases;
    }

    const fallbackPhraseGroups = await Promise.all(
      candidateMasterMinds.map(async (masterMind) => {
        const masterMindId = String(masterMind.id ?? "");
        const masterMindName = String(masterMind.name ?? "");
        const masterMindRole = cleanMasterMindRole(masterMind.role);
        const { data: phraseRows } = await supabase
          .from("phrases")
          .select("*")
          .eq("master_mind_id", masterMindId);

        return (phraseRows ?? [])
          .map((phraseRow) => {
            const phraseText = getStringField({ text: phraseRow.text }, [
              "text",
              "frase",
              "Frase",
            ]);
            const categories = Array.isArray(phraseRow.categories)
              ? phraseRow.categories.filter(
                  (value: unknown): value is string =>
                    typeof value === "string",
                )
              : [];

            if (!phraseText) {
              return null;
            }

            return {
              id: `${masterMindId}:${String(phraseRow.id ?? "")}`,
              phrase: phraseText,
              category: categories.join(" · ") || "Sin categoría",
              masterMindName,
              masterMindRole,
            } satisfies PhraseRecord;
          })
          .filter((item): item is PhraseRecord => Boolean(item));
      }),
    );

    return fallbackPhraseGroups.flat();
  } catch (error) {
    console.warn("Could not load phrases from Supabase", error);
    return [];
  }
}

export async function loadAllPhrases(): Promise<PhraseRecord[]> {
  try {
    const { data: masterMinds, error: masterMindsError } = await supabase
      .from("master_minds")
      .select("*");

    if (masterMindsError) {
      throw masterMindsError;
    }

    const phraseGroups = await Promise.all(
      (masterMinds ?? []).map(async (masterMind) => {
        const masterMindId = String(masterMind.id ?? "");
        const masterMindName = String(masterMind.name ?? "");
        const masterMindRole = cleanMasterMindRole(masterMind.role);

        const { data: phraseRows, error: phraseRowsError } = await supabase
          .from("phrases")
          .select("*")
          .eq("master_mind_id", masterMindId);

        if (phraseRowsError) {
          throw phraseRowsError;
        }

        return (phraseRows ?? [])
          .map((phraseRow) => {
            const phraseText = getStringField({ text: phraseRow.text }, [
              "text",
              "frase",
              "Frase",
            ]);
            const categories = Array.isArray(phraseRow.categories)
              ? phraseRow.categories.filter(
                  (value: unknown): value is string =>
                    typeof value === "string",
                )
              : [];

            if (!phraseText) {
              return null;
            }

            return {
              id: `${masterMindId}:${String(phraseRow.id ?? "")}`,
              phrase: phraseText,
              category: categories.join(" · ") || "Sin categoría",
              masterMindName,
              masterMindRole,
            } satisfies PhraseRecord;
          })
          .filter((item): item is PhraseRecord => Boolean(item));
      }),
    );

    return shufflePhrases(phraseGroups.flat());
  } catch (error) {
    console.warn("Could not load all phrases from Supabase", error);
    return [];
  }
}
