import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";

import { BodyZone, BODY_ZONES, BodyView } from "../constants/body-zones";
import { Colors } from "../constants/colors";

const DOT_SIZE = 22;

const BODY_IMAGES: Record<BodyView, number> = {
  face: require("../assets/images/body-front.png"),
  dos: require("../assets/images/body-back.png"),
};

function isPoint(z: BodyZone): z is Extract<BodyZone, { shape: "point" }> {
  return z.shape === "point";
}

function isPolygon(z: BodyZone): z is Extract<BodyZone, { shape: "polygon" }> {
  return z.shape === "polygon";
}

function intensityColor(intensity: number | undefined): string {
  if (intensity === undefined) return Colors.grayMedium;
  if (intensity <= 3) return Colors.riskLow;
  if (intensity <= 6) return Colors.riskMedium;
  return Colors.riskHigh;
}

export function BodyChart({
  view,
  intensityByZone,
  selectedZone,
  onSelectZone,
}: {
  view: BodyView;
  intensityByZone: Record<string, number>;
  selectedZone?: string | null;
  onSelectZone: (zoneKey: string) => void;
}) {
  const zones = BODY_ZONES.filter((z) => z.view === view);
  const points = zones.filter(isPoint);
  const polygons = zones.filter(isPolygon);

  return (
    <View style={styles.container}>
      <Image source={BODY_IMAGES[view]} style={styles.bodyImage} resizeMode="contain" />

      {/* Un seul système de coordonnées 0-100 (calé sur les % des zones) qui
          étire non-uniformément pour coller exactement au conteneur, quel
          que soit son ratio largeur/hauteur réel à l'écran. */}
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFillObject}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {polygons.map((zone) => {
          const intensity = intensityByZone[zone.key];
          const isSelected = zone.key === selectedZone;
          const hasValue = intensity !== undefined;
          const active = hasValue || isSelected;
          return (
            <Polygon
              key={zone.key}
              points={zone.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={hasValue ? intensityColor(intensity) : Colors.primary}
              fillOpacity={active ? 0.85 : 0.001}
              {...(active ? ({ style: { mixBlendMode: "multiply" } } as any) : {})}
              onPress={() => onSelectZone(zone.key)}
            />
          );
        })}
      </Svg>

      {points.map((zone) => (
        <TouchableOpacity
          key={zone.key}
          style={[
            styles.dot,
            {
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              backgroundColor: intensityColor(intensityByZone[zone.key]),
            },
            zone.key === selectedZone && styles.dotSelected,
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
    aspectRatio: 0.518,
    alignSelf: "center",
    backgroundColor: "#000000",
    borderRadius: 20,
    overflow: "hidden",
  },

  bodyImage: {
    width: "100%",
    height: "100%",
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

  dotSelected: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },
});

export function BodyZoneLabel(zoneKey: string): string {
  return BODY_ZONES.find((z) => z.key === zoneKey)?.label ?? zoneKey;
}
