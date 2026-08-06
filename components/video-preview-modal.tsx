import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  videoUrl: string | null;
  onClose: () => void;
};

export default function VideoPreviewModal({ visible, videoUrl, onClose }: Props) {
  const player = useVideoPlayer(videoUrl ?? "", (p) => {
    p.loop = true;
    if (visible) p.play();
  });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={26} color="#FFF" />
        </TouchableOpacity>
        {visible && videoUrl ? (
          <VideoView
            style={styles.video}
            player={player}
            nativeControls
            allowsFullscreen
            contentFit="contain"
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButton: {
    position: "absolute",
    top: 50,
    right: 24,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  video: {
    width: "100%",
    height: "70%",
  },
});
