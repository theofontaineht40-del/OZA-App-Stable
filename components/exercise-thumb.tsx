import { Image, StyleSheet, View } from "react-native";

import { ExerciseTemplate } from "../constants/exercise-library";
import { MovementIllustration } from "./exercise-illustrations";
import InlineLoopingVideo from "./inline-looping-video";

// Visuel d'un exercice partout où il est listé : la vidéo en boucle si elle
// existe, sinon la photo, sinon l'illustration du schéma de mouvement — il y a
// toujours quelque chose à montrer.
export default function ExerciseThumb({
  exercise,
  size = 56,
  radius = 14,
}: {
  exercise?: Pick<ExerciseTemplate, "videoUrl" | "photoUrl" | "pattern"> | null;
  size?: number;
  radius?: number;
}) {
  if (exercise?.videoUrl) {
    return <InlineLoopingVideo videoUrl={exercise.videoUrl} size={size} borderRadius={radius} />;
  }
  if (exercise?.photoUrl) {
    return (
      <Image
        source={{ uri: exercise.photoUrl }}
        style={[styles.photo, { width: size, height: size, borderRadius: radius }]}
        resizeMode="contain"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden" }}>
      <MovementIllustration pattern={exercise?.pattern ?? "isolation"} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: "#FFFFFF",
  },
});
