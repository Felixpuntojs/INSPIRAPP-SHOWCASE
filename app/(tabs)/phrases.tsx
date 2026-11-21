// import { useFocusEffect, useRouter } from "expo-router";
// import { memo, useCallback, useState } from "react";
// import {
//     FlatList,
//     ListRenderItemInfo,
//     Pressable,
//     StyleSheet,
//     View,
//     useWindowDimensions,
// } from "react-native";

// import { ThemedText } from "@/components/themed-text";
// import { ThemedView } from "@/components/themed-view";
// import { Fonts, Inspira } from "@/constants/theme";
// import { auth } from "@/lib/firebase";
// import { loadAllPhrases, type PhraseRecord } from "@/lib/phrase-library";

// type PhraseFeedCardProps = {
//   phrase: PhraseRecord;
//   cardHeight: number;
// };

// const PhraseFeedCard = memo(function PhraseFeedCard({
//   phrase,
//   cardHeight,
// }: PhraseFeedCardProps) {
//   return (
//     <View style={[styles.phraseCard, { height: cardHeight }]}>
//       <ThemedText style={styles.phraseText}>{phrase.phrase}</ThemedText>

//       <View style={styles.authorBlock}>
//         <ThemedText style={styles.masterMindName} numberOfLines={1}>
//           {phrase.masterMindName}
//         </ThemedText>
//         <ThemedText muted style={styles.masterMindRole} numberOfLines={1}>
//           {phrase.masterMindRole || "Sin quien"}
//         </ThemedText>
//       </View>

//       <View style={styles.categoryChip}>
//         <ThemedText style={styles.categoryChipLabel} numberOfLines={1}>
//           {phrase.category || "Sin categoría"}
//         </ThemedText>
//       </View>
//     </View>
//   );
// });

// export default function PhrasesScreen() {
//   const router = useRouter();
//   const { height: windowHeight } = useWindowDimensions();
//   const [isLoading, setIsLoading] = useState(true);
//   const [contentError, setContentError] = useState("");
//   const [allPhrases, setAllPhrases] = useState<PhraseRecord[]>([]);

//   const feedCardHeight = Math.max(windowHeight - 230, 430);

//   useFocusEffect(
//     useCallback(() => {
//       let isActive = true;

//       async function loadContent() {
//         const user = auth.currentUser;
//         if (!user) {
//           router.replace("/login");
//           return;
//         }

//         if (isActive) {
//           setIsLoading(true);
//           setContentError("");
//         }

//         try {
//           const phrases = await loadAllPhrases();

//           if (!isActive) {
//             return;
//           }

//           setAllPhrases(phrases);
//         } catch {
//           if (isActive) {
//             setContentError(
//               "No se pudieron cargar las frases. Revisa tu conexión o permisos de Firestore.",
//             );
//           }
//         } finally {
//           if (isActive) {
//             setIsLoading(false);
//           }
//         }
//       }

//       void loadContent();

//       return () => {
//         isActive = false;
//       };
//     }, [router]),
//   );

//   const keyExtractor = useCallback((phrase: PhraseRecord) => phrase.id, []);

//   const renderItem = useCallback(
//     ({ item }: ListRenderItemInfo<PhraseRecord>) => (
//       <PhraseFeedCard phrase={item} cardHeight={feedCardHeight} />
//     ),
//     [feedCardHeight],
//   );

//   return (
//     <ThemedView style={styles.container}>
//       <View style={styles.topBar}>
//         <Pressable onPress={() => router.back()} style={styles.backButton}>
//           <ThemedText style={styles.backLabel}>‹</ThemedText>
//         </Pressable>
//         <ThemedText type="title" style={styles.title}>
//           Frases
//         </ThemedText>
//       </View>

//       {isLoading ? (
//         <ThemedText muted style={styles.loadingText}>
//           Cargando frases...
//         </ThemedText>
//       ) : null}

//       {contentError ? (
//         <ThemedText style={styles.errorText}>{contentError}</ThemedText>
//       ) : null}

//       <FlatList
//         style={styles.listArea}
//         contentContainerStyle={styles.listContent}
//         data={allPhrases}
//         keyExtractor={keyExtractor}
//         renderItem={renderItem}
//         showsVerticalScrollIndicator={false}
//         removeClippedSubviews
//         initialNumToRender={2}
//         maxToRenderPerBatch={2}
//         windowSize={3}
//         updateCellsBatchingPeriod={50}
//         pagingEnabled
//         decelerationRate="fast"
//         snapToInterval={feedCardHeight + Inspira.spacing.md}
//         snapToAlignment="start"
//         disableIntervalMomentum
//         getItemLayout={(_, index) => ({
//           length: feedCardHeight + Inspira.spacing.md,
//           offset: (feedCardHeight + Inspira.spacing.md) * index,
//           index,
//         })}
//       />
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: 86,
//     paddingHorizontal: Inspira.spacing.lg,
//   },
//   topBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Inspira.spacing.sm,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: Inspira.radii.pill,
//     backgroundColor: "rgba(255,255,255,0.03)",
//   },
//   backLabel: {
//     fontSize: 28,
//     lineHeight: 28,
//     color: Inspira.palette.text,
//   },
//   title: {
//     flex: 1,
//   },
//   subtitle: {
//     marginTop: Inspira.spacing.sm,
//     marginBottom: Inspira.spacing.lg,
//   },
//   loadingText: {
//     marginTop: Inspira.spacing.md,
//   },
//   errorText: {
//     marginTop: Inspira.spacing.md,
//     color: Inspira.palette.danger,
//   },
//   listArea: {
//     flex: 1,
//     marginTop: Inspira.spacing.lg,
//   },
//   listContent: {
//     paddingBottom: Inspira.spacing.xl,
//   },
//   phraseCard: {
//     borderRadius: 28,
//     borderWidth: 1,
//     borderColor: "rgba(42, 36, 24, 0.10)",
//     backgroundColor: "#E8D9BC",
//     paddingHorizontal: Inspira.spacing.lg,
//     paddingVertical: Inspira.spacing.xl,
//     marginBottom: Inspira.spacing.md,
//     justifyContent: "center",
//     alignItems: "center",
//     gap: Inspira.spacing.lg,
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 22,
//     shadowOffset: { width: 0, height: 12 },
//     elevation: 7,
//   },
//   phraseText: {
//     color: "#241C10",
//     fontFamily: Fonts.serif,
//     fontStyle: "italic",
//     fontSize: 24,
//     lineHeight: 34,
//     fontWeight: "600",
//     textAlign: "center",
//     maxWidth: 320,
//   },
//   authorBlock: {
//     alignItems: "center",
//     gap: 6,
//   },
//   masterMindName: {
//     color: "#2D2213",
//     fontFamily: Fonts.serif,
//     fontStyle: "italic",
//     fontSize: 19,
//     lineHeight: 26,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   masterMindRole: {
//     color: "#5A4A32",
//     fontSize: 13,
//     lineHeight: 18,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   categoryChip: {
//     alignSelf: "center",
//     borderRadius: Inspira.radii.pill,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     backgroundColor: "rgba(36, 28, 16, 0.08)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   categoryChipLabel: {
//     color: "#3A2D19",
//     fontSize: 12,
//     lineHeight: 14,
//     fontWeight: "700",
//     textAlign: "center",
//   },
// });

import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useState } from "react";
import {
    FlatList,
    ListRenderItemInfo,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Inspira } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import { loadAllPhrases, type PhraseRecord } from "@/lib/phrase-library";

type PhraseFeedCardProps = {
  phrase: PhraseRecord;
  cardHeight: number;
};

const PhraseFeedCard = memo(function PhraseFeedCard({
  phrase,
  cardHeight,
}: PhraseFeedCardProps) {
  return (
    <View style={[styles.phraseCard, { height: cardHeight }]}>
      <ThemedText style={styles.phraseText}>"{phrase.phrase}"</ThemedText>

      <View style={styles.authorBlock}>
        <ThemedText style={styles.masterMindName} numberOfLines={1}>
          {phrase.masterMindName}
        </ThemedText>

        <ThemedText muted style={styles.masterMindRole} numberOfLines={1}>
          {phrase.masterMindRole || "Sin quien"}
        </ThemedText>
      </View>

      <View style={styles.categoryChip}>
        <ThemedText style={styles.categoryChipLabel} numberOfLines={1}>
          {phrase.category || "Sin categoría"}
        </ThemedText>
      </View>
    </View>
  );
});

export default function PhrasesScreen() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [contentError, setContentError] = useState("");
  const [allPhrases, setAllPhrases] = useState<PhraseRecord[]>([]);

  /*
   * La FlatList no ocupa toda la pantalla porque arriba tenemos:
   *
   * paddingTop
   * header
   * marginTop
   *
   * Por eso calculamos el espacio real que queremos
   * darle a la tarjeta.
   *
   * Puedes modificar estos valores fácilmente.
   */

  const topSpace = 86;
  const headerHeight = 40;
  const listTopMargin = 28;

  /*
   * Espacio que queremos dejar alrededor de la tarjeta.
   */
  const cardVerticalMargin = 20;

  const availableHeight =
    windowHeight - topSpace - headerHeight - listTopMargin;

  const feedCardHeight = Math.max(
    availableHeight - cardVerticalMargin * 2,
    400,
  );

  /*
   * El espacio total que ocupa cada elemento de la lista.
   */
  const itemHeight = feedCardHeight + cardVerticalMargin * 2;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadContent() {
        const user = auth.currentUser;

        if (!user) {
          router.replace("/login");
          return;
        }

        if (isActive) {
          setIsLoading(true);
          setContentError("");
        }

        try {
          const phrases = await loadAllPhrases();

          if (!isActive) {
            return;
          }

          setAllPhrases(phrases);
        } catch {
          if (isActive) {
            setContentError(
              "No se pudieron cargar las frases. Revisa tu conexión o permisos de Firestore.",
            );
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void loadContent();

      return () => {
        isActive = false;
      };
    }, [router]),
  );

  const keyExtractor = useCallback((phrase: PhraseRecord) => phrase.id, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PhraseRecord>) => (
      <View style={styles.page}>
        <PhraseFeedCard phrase={item} cardHeight={feedCardHeight} />
      </View>
    ),
    [feedCardHeight],
  );

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backLabel}>‹</ThemedText>
        </Pressable>

        <ThemedText type="title" style={styles.title}>
          Frases
        </ThemedText>
      </View>

      {/* LOADING */}
      {isLoading ? (
        <ThemedText muted style={styles.loadingText}>
          Cargando frases...
        </ThemedText>
      ) : null}

      {/* ERROR */}
      {contentError ? (
        <ThemedText style={styles.errorText}>{contentError}</ThemedText>
      ) : null}

      {/* LISTA */}
      <FlatList
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
        data={allPhrases}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        updateCellsBatchingPeriod={50}
        pagingEnabled
        decelerationRate="fast"
        /*
         * Cada swipe avanza exactamente una página.
         */
        snapToInterval={itemHeight}
        snapToAlignment="start"
        disableIntervalMomentum
        /*
         * Optimización.
         */
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    /*
     * Espacio superior de la pantalla.
     */
    paddingTop: 86,

    paddingHorizontal: Inspira.spacing.lg,
  },

  topBar: {
    height: 40,

    flexDirection: "row",
    alignItems: "center",

    gap: Inspira.spacing.sm,
  },

  backButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: Inspira.radii.pill,

    backgroundColor: "rgba(255,255,255,0.03)",
  },

  backLabel: {
    fontSize: 28,
    lineHeight: 28,

    color: Inspira.palette.text,
  },

  title: {
    flex: 1,
  },

  loadingText: {
    marginTop: Inspira.spacing.md,
  },

  errorText: {
    marginTop: Inspira.spacing.md,

    color: Inspira.palette.danger,
  },

  listArea: {
    flex: 1,

    /*
     * Separación entre el header
     * y las tarjetas.
     */
    marginTop: 28,
  },

  listContent: {
    /*
     * Un poco de espacio al final.
     */
    paddingBottom: 40,
  },

  /*
   * Cada elemento de la FlatList
   * funciona como una "página".
   */
  page: {
    justifyContent: "center",
    alignItems: "center",

    paddingVertical: 20,
  },

  phraseCard: {
    width: "100%",

    borderRadius: 28,

    borderWidth: 1,

    borderColor: "rgba(42, 36, 24, 0.10)",

    backgroundColor: "#E8D9BC",

    paddingHorizontal: Inspira.spacing.lg,

    paddingVertical: Inspira.spacing.xl,

    justifyContent: "center",
    alignItems: "center",

    gap: Inspira.spacing.lg,

    shadowColor: "#000",

    shadowOpacity: 0.2,

    shadowRadius: 22,

    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 7,
  },

  phraseText: {
    color: "#241C10",

    fontFamily: Fonts.serif,

    fontStyle: "italic",

    fontSize: 24,

    lineHeight: 34,

    fontWeight: "600",

    textAlign: "center",

    maxWidth: 320,
  },

  authorBlock: {
    alignItems: "center",

    gap: 6,
  },

  masterMindName: {
    color: "#2D2213",

    fontFamily: Fonts.serif,

    fontStyle: "italic",

    fontSize: 19,

    lineHeight: 26,

    fontWeight: "600",

    textAlign: "center",
  },

  masterMindRole: {
    color: "#5A4A32",

    fontSize: 13,

    lineHeight: 18,

    fontWeight: "600",

    textAlign: "center",
  },

  categoryChip: {
    alignSelf: "center",

    borderRadius: Inspira.radii.pill,

    paddingHorizontal: 12,

    paddingVertical: 6,

    backgroundColor: "rgba(36, 28, 16, 0.08)",

    justifyContent: "center",

    alignItems: "center",
  },

  categoryChipLabel: {
    color: "#3A2D19",

    fontSize: 12,

    lineHeight: 14,

    fontWeight: "700",

    textAlign: "center",
  },
});
