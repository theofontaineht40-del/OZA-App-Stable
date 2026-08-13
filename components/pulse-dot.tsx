import { useRef } from "react";
import { Animated, StyleProp, TouchableOpacity, ViewStyle } from "react-native";

type Props = {
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  children: React.ReactNode;
};

// Petit "pop" (scale up puis retour élastique) au clic — utilisé pour les
// sélecteurs à points (RPE, échelles de ressenti) qui ne changeaient jusque-là
// que de couleur, sans aucun retour visuel de l'interaction elle-même.
export default function PulseDot({ style, onPress, children }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    onPress();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.25, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={style} onPress={handlePress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
