import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet } from "react-native";

type Props = {
  videoUrl: string;
  size?: number;
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
};

// Lecture en boucle, muette, automatique — la vignette est directement une
// vidéo qui bouge (façon Lyfta) plutôt qu'une photo statique ou une vidéo
// qu'il faut ouvrir en plein écran pour voir. `size` reste un raccourci pour
// une vignette carrée ; `width`/`height` permettent un bandeau rectangulaire.
export default function InlineLoopingVideo({ videoUrl, size = 40, width, height, borderRadius = 10 }: Props) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      style={[styles.video, { width: width ?? size, height: height ?? size, borderRadius }]}
      player={player}
      nativeControls={false}
      contentFit="cover"
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  video: {
    backgroundColor: "#F5F5F5",
  },
});
