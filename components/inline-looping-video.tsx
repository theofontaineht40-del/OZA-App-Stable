import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet } from "react-native";

type Props = { videoUrl: string; size?: number; borderRadius?: number };

// Lecture en boucle, muette, automatique — la vignette est directement une
// vidéo qui bouge (façon Lyfta) plutôt qu'une photo statique ou une vidéo
// qu'il faut ouvrir en plein écran pour voir.
export default function InlineLoopingVideo({ videoUrl, size = 40, borderRadius = 10 }: Props) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      style={[styles.video, { width: size, height: size, borderRadius }]}
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
