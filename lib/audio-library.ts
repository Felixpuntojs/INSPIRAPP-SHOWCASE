import { supabase } from "@/lib/supabase";

export const AUDIO_BUCKET = "AUDIOS";

export type AudioTrack = {
  path: string;
  person: string;
  folder: string;
  title: string;
  voice: string;
};

export function pickDailyAudioTrack(
  audioTracks: AudioTrack[],
  seed: string,
): AudioTrack | null {
  if (!audioTracks.length) {
    return null;
  }

  const hash = Array.from(seed).reduce((accumulator, character) => {
    return (accumulator * 31 + character.charCodeAt(0)) >>> 0;
  }, 0);

  return audioTracks[hash % audioTracks.length] ?? null;
}

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|wav|ogg|opus|flac|webm)$/i;
const GENERIC_AUDIO_NAMES = /^(audio|track|voice|voz|recording|grabacion)$/i;
const SPANISH_ACCENTS: Record<string, string> = {
  alegria: "alegría",
  aqui: "aquí",
  atencion: "atención",
  tambien: "también",
  cancion: "canción",
  compasion: "compasión",
  conexion: "conexión",
  corazon: "corazón",
  despues: "después",
  dificil: "difícil",
  energia: "energía",
  estres: "estrés",
  facil: "fácil",
  meditacion: "meditación",
  mirate: "mírate",
  musica: "música",
  mas: "más",
  perdon: "perdón",
  proposito: "propósito",
  relajacion: "relajación",
  respiracion: "respiración",
  sanacion: "sanación",
};

function displayLabel(value: string): string {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function correctSpanishAccents(value: string): string {
  return value.replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g, (word) => {
    const correction = SPANISH_ACCENTS[word.toLowerCase()];

    if (!correction) {
      return word;
    }

    if (word === word.toUpperCase()) {
      return correction.toUpperCase();
    }

    if (word[0] === word[0]?.toUpperCase()) {
      return correction[0]?.toUpperCase() + correction.slice(1);
    }

    return correction;
  });
}

function metadataLabel(
  metadata: Record<string, unknown> | null,
  key: string,
): string {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

async function listFolder(path: string) {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).list(path, {
    limit: 100,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function loadAudioTracks(): Promise<AudioTrack[]> {
  const rootEntries = await listFolder("");
  const people = rootEntries.filter((entry) => entry.id === null);

  const tracksByPerson = await Promise.all(
    people.map(async (personEntry) => {
      const person = correctSpanishAccents(displayLabel(personEntry.name));
      const tracks: AudioTrack[] = [];

      async function visitFolder(
        path: string,
        folderLabels: string[],
        depth: number,
      ): Promise<void> {
        if (depth > 5) {
          return;
        }

        const entries = await listFolder(path);

        for (const entry of entries) {
          const entryPath = path ? `${path}/${entry.name}` : entry.name;

          if (entry.id === null) {
            await visitFolder(
              entryPath,
              [
                ...folderLabels,
                correctSpanishAccents(displayLabel(entry.name)),
              ],
              depth + 1,
            );
            continue;
          }

          if (!AUDIO_EXTENSIONS.test(entry.name)) {
            continue;
          }

          const metadata = entry.metadata as Record<string, unknown> | null;
          const fileLabel = displayLabel(entry.name);
          const folder = folderLabels.at(-1) ?? "";
          const title = correctSpanishAccents(
            metadataLabel(metadata, "title") ||
              (folder && GENERIC_AUDIO_NAMES.test(fileLabel)
                ? folder
                : fileLabel),
          );
          const voice = correctSpanishAccents(
            metadataLabel(metadata, "voice") ||
              metadataLabel(metadata, "artist") ||
              person,
          );

          tracks.push({
            path: entryPath,
            person,
            folder,
            title,
            voice,
          });
        }
      }

      await visitFolder(personEntry.name, [], 0);
      return tracks;
    }),
  );

  return tracksByPerson
    .flat()
    .sort((first, second) =>
      `${first.person}/${first.folder}/${first.title}`.localeCompare(
        `${second.person}/${second.folder}/${second.title}`,
        "es",
      ),
    );
}

export async function createAudioUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}
