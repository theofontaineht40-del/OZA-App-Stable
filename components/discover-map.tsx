import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";

import { Colors } from "../constants/colors";
import { escapeHtml } from "../utils/escape-html";
import { spreadOverlappingPins } from "../utils/spread-map-pins";

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

const FRANCE_CENTER = { lat: 46.6, lng: 2.4 };

// Pas de lib de carte native cross-platform gratuite : on charge Leaflet +
// OpenStreetMap dans une WebView, avec les mêmes tuiles que la version web
// (components/discover-map.web.tsx) pour un rendu identique.
function buildHtml(coaches: MapCoachPin[], selectedUid: string | null): string {
  const spread = spreadOverlappingPins(coaches);
  const markers = JSON.stringify(
    spread.map((c) => ({ uid: c.uid, lat: c.lat, lng: c.lng, label: escapeHtml(c.label), active: c.uid === selectedUid }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .oza-pin {
      background: ${Colors.text};
      color: #fff;
      font-family: -apple-system, sans-serif;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
      border-radius: 16px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .oza-pin.active { background: ${Colors.primary}; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var coaches = ${markers};
    var map = L.map('map', { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    if (coaches.length === 0) {
      map.setView([${FRANCE_CENTER.lat}, ${FRANCE_CENTER.lng}], 6);
    } else if (coaches.length === 1) {
      map.setView([coaches[0].lat, coaches[0].lng], 12);
    } else {
      var bounds = L.latLngBounds(coaches.map(function (c) { return [c.lat, c.lng]; }));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    coaches.forEach(function (c) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="oza-pin' + (c.active ? ' active' : '') + '">' + c.label + '</div>',
      });
      var marker = L.marker([c.lat, c.lng], { icon: icon }).addTo(map);
      marker.on('click', function () {
        window.ReactNativeWebView.postMessage(c.uid);
      });
    });
  </script>
</body>
</html>`;
}

export default function DiscoverMap({ coaches, selectedUid, onSelect }: Props) {
  const html = useMemo(() => buildHtml(coaches, selectedUid), [coaches, selectedUid]);

  function handleMessage(event: WebViewMessageEvent) {
    onSelect(event.nativeEvent.data);
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
