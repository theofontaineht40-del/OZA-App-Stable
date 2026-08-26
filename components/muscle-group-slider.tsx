import { useEffect, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../constants/colors";

// Contenu du widget "Programmes" existant (voir app/sportif/index.tsx) :
// un slider de visuels anatomiques par groupe musculaire, généré à partir
// des mêmes calques que le corps de MuscleMap (assets/muscles/), aplatis en
// une image par slide (assets/muscles/slides/*.png) pour un rendu léger.
//
// Couverture actuelle : Jambes, Pectoraux, Dos — les 3 groupes pour
// lesquels un calque source existe. Épaules, Bras et Abdos manquent
// d'assets dédiés (voir limitation déjà signalée pour MuscleMap) ; les
// ajouter ici ne demandera qu'une entrée supplémentaire dans SLIDES une
// fois les images disponibles.
const SLIDES = [
  { key: "jambes", label: "Jambes", image: require("../assets/muscles/slides/jambes.png") },
  { key: "pectoraux", label: "Pectoraux", image: require("../assets/muscles/slides/pectoraux.png") },
  { key: "dos", label: "Dos", image: require("../assets/muscles/slides/dos.png") },
];

const ASPECT_RATIO = 792 / 560;
const AUTO_ADVANCE_MS = 4000;

type ScrollableRef = { scrollTo: (options: { x: number; animated: boolean }) => void };

export default function MuscleGroupSlider() {
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const scrollRef = useRef<ScrollableRef | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function scrollToIndex(i: number, width: number) {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  }

  function restartTimer(width: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    if (width <= 0) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        scrollToIndex(next, width);
        return next;
      });
    }, AUTO_ADVANCE_MS);
  }

  useEffect(() => {
    restartTimer(slideWidth);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slideWidth]);

  function goTo(i: number) {
    setIndex(i);
    scrollToIndex(i, slideWidth);
    restartTimer(slideWidth);
  }

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (slideWidth <= 0) return;
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setIndex(newIndex);
    // Une interaction manuelle ne coupe pas l'auto-avance : on relance juste
    // le minuteur pour repartir proprement depuis la position actuelle.
    restartTimer(slideWidth);
  }

  return (
    <View style={styles.container}>
      <View style={styles.track} onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}>
        {slideWidth > 0 && (
          <Animated.ScrollView
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={scrollRef as any}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: true,
            })}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMomentumScrollEnd}
          >
            {SLIDES.map((slide, i) => {
              const inputRange = [(i - 1) * slideWidth, i * slideWidth, (i + 1) * slideWidth];
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.35, 1, 0.35],
                extrapolate: "clamp",
              });
              return (
                <View key={slide.key} style={[styles.slide, { width: slideWidth }]}>
                  <Animated.Image
                    source={slide.image}
                    style={[styles.image, { opacity }]}
                    resizeMode="contain"
                  />
                </View>
              );
            })}
          </Animated.ScrollView>
        )}
      </View>

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <TouchableOpacity
            key={slide.key}
            onPress={() => goTo(i)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <View style={[styles.dot, i === index && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const IMAGE_HEIGHT = 132;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },

  track: {
    width: "100%",
  },

  slide: {
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: IMAGE_HEIGHT / ASPECT_RATIO,
    height: IMAGE_HEIGHT,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },

  dotActive: {
    width: 16,
    backgroundColor: Colors.primary,
  },
});
