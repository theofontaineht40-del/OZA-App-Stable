import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BODY_ZONES, BodyView } from "../constants/body-zones";
import { Colors } from "../constants/colors";

const DOT_SIZE = 20;

function intensityColor(intensity: number | undefined): string {
  if (intensity === undefined) return Colors.grayMedium;
  if (intensity <= 3) return Colors.riskLow;
  if (intensity <= 6) return Colors.riskMedium;
  return Colors.riskHigh;
}

export function BodyChart({
  view,
  intensityByZone,
  onSelectZone,
}: {
  view: BodyView;
  intensityByZone: Record<string, number>;
  onSelectZone: (zoneKey: string) => void;
}) {
  const zones = BODY_ZONES.filter((z) => z.view === view);

  return (
    <View style={styles.container}>
      <View style={styles.silhouetteHead} />
      <View style={styles.silhouetteNeck} />
      <View style={styles.silhouetteTorso} />
      <View style={[styles.silhouetteArm, styles.armLeft]} />
      <View style={[styles.silhouetteArm, styles.armRight]} />
      <View style={[styles.silhouetteLeg, styles.legLeft]} />
      <View style={[styles.silhouetteLeg, styles.legRight]} />

      {zones.map((zone) => (
        <TouchableOpacity
          key={zone.key}
          style={[
            styles.dot,
            {
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              backgroundColor: intensityColor(intensityByZone[zone.key]),
            },
          ]}
          onPress={() => onSelectZone(zone.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 0.58,
    backgroundColor: Colors.grayLight,
    borderRadius: 20,
    overflow: "hidden",
  },

  silhouetteHead: {
    position: "absolute",
    width: "16%",
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "#E3E3E3",
    left: "42%",
    top: "2%",
  },

  silhouetteNeck: {
    position: "absolute",
    width: "8%",
    height: "3%",
    backgroundColor: "#E3E3E3",
    left: "46%",
    top: "13%",
  },

  silhouetteTorso: {
    position: "absolute",
    width: "36%",
    height: "28%",
    borderRadius: 24,
    backgroundColor: "#E3E3E3",
    left: "32%",
    top: "16%",
  },

  silhouetteArm: {
    position: "absolute",
    width: "10%",
    height: "26%",
    borderRadius: 16,
    backgroundColor: "#E3E3E3",
  },

  armLeft: {
    left: "16%",
    top: "18%",
    transform: [{ rotate: "8deg" }],
  },

  armRight: {
    left: "74%",
    top: "18%",
    transform: [{ rotate: "-8deg" }],
  },

  silhouetteLeg: {
    position: "absolute",
    width: "14%",
    height: "40%",
    borderRadius: 16,
    backgroundColor: "#E3E3E3",
  },

  legLeft: {
    left: "33%",
    top: "44%",
  },

  legRight: {
    left: "53%",
    top: "44%",
  },

  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginLeft: -DOT_SIZE / 2,
    marginTop: -DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.white,
  },
});

export function BodyZoneLabel(zoneKey: string): string {
  return BODY_ZONES.find((z) => z.key === zoneKey)?.label ?? zoneKey;
}
