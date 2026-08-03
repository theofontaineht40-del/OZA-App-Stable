import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type * as Leaflet from "leaflet";
import type {
  MapContainer as MapContainerType,
  Marker as MarkerType,
  TileLayer as TileLayerType,
} from "react-leaflet";

import { Colors } from "../constants/colors";
import { escapeHtml } from "../utils/escape-html";

export type MapCoachPin = {
  uid: string;
  lat: number;
  lng: number;
  label: string;
};

type Props = {
  coaches: MapCoachPin[];
  selectedUid: string | null;
  onSelect: (uid: string) => void;
};

const FRANCE_CENTER: [number, number] = [46.6, 2.4];

type LeafletBundle = {
  L: typeof Leaflet;
  MapContainer: typeof MapContainerType;
  TileLayer: typeof TileLayerType;
  Marker: typeof MarkerType;
};

// Leaflet accède à window/document dès son import. expo-router prérend les
// pages web côté Node (même en dev), où window n'existe pas : on charge
// donc la lib dynamiquement, uniquement une fois montés côté client.
function useLeafletBundle(): LeafletBundle | null {
  const [bundle, setBundle] = useState<LeafletBundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("leaflet"), import("react-leaflet")]).then(([leafletModule, reactLeaflet]) => {
      if (cancelled) return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      setBundle({
        L: (leafletModule as any).default ?? leafletModule,
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return bundle;
}

export default function DiscoverMap(props: Props) {
  const bundle = useLeafletBundle();

  if (!bundle) {
    return <View style={styles.container} />;
  }

  return <LoadedMap {...props} bundle={bundle} />;
}

function LoadedMap({
  coaches,
  selectedUid,
  onSelect,
  bundle,
}: Props & { bundle: LeafletBundle }) {
  const { L, MapContainer, TileLayer, Marker } = bundle;
  const mapRef = useRef<Leaflet.Map | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (coaches.length === 0) return;
    if (coaches.length === 1) {
      map.setView([coaches[0].lat, coaches[0].lng], 12);
      return;
    }
    const bounds = L.latLngBounds(coaches.map((c) => [c.lat, c.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [coaches, L]);

  function pinIcon(active: boolean, label: string) {
    return L.divIcon({
      className: "",
      html: `<div style="
        background:${active ? Colors.primary : Colors.text};
        color:#fff;
        font-family:-apple-system,sans-serif;
        font-size:12px;
        font-weight:700;
        padding:6px 10px;
        border-radius:16px;
        white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
      ">${escapeHtml(label)}</div>`,
      iconAnchor: [20, 16],
    });
  }

  return (
    <View style={styles.container}>
      <MapContainer ref={mapRef} center={FRANCE_CENTER} zoom={6} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coaches.map((c) => (
          <Marker
            key={c.uid}
            position={[c.lat, c.lng]}
            icon={pinIcon(c.uid === selectedUid, c.label)}
            eventHandlers={{ click: () => onSelect(c.uid) }}
          />
        ))}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
