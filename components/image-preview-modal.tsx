import { Ionicons } from "@expo/vector-icons";
import { Image, Modal, StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
};

export default function ImagePreviewModal({ visible, imageUrl, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={26} color="#FFF" />
        </TouchableOpacity>
        {visible && imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
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

  image: {
    width: "92%",
    height: "80%",
  },
});
