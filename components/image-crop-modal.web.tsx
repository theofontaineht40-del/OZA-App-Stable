import { useEffect, useRef, useState } from "react";

import { Colors } from "../constants/colors";

type Props = {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;
};

const VIEWPORT = 280;
const OUTPUT_SIZE = 512;

// Le navigateur n'a pas d'équivalent à l'outil de recadrage natif iOS/Android
// (contrairement à `allowsEditing` sur ImagePicker, ignoré sur web) : on
// dessine donc nous-mêmes un recadreur — déplacer/zoomer l'image dans un
// cadre circulaire fixe, puis export via <canvas> au moment de valider.
export default function ImageCropModal({ visible, imageUri, onCancel, onConfirm }: Props) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!visible || !imageUri) {
      setNaturalSize(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      return;
    }
    const img = new Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUri;
  }, [visible, imageUri]);

  if (!visible || !imageUri) return null;

  const baseScale = naturalSize ? VIEWPORT / Math.min(naturalSize.w, naturalSize.h) : 1;
  const scale = baseScale * zoom;
  const dispW = naturalSize ? naturalSize.w * scale : VIEWPORT;
  const dispH = naturalSize ? naturalSize.h * scale : VIEWPORT;
  const maxPanX = Math.max(0, (dispW - VIEWPORT) / 2);
  const maxPanY = Math.max(0, (dispH - VIEWPORT) / 2);

  function clamp(value: number, max: number) {
    return Math.min(max, Math.max(-max, value));
  }

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({
      x: clamp(dragRef.current.originX + dx, maxPanX),
      y: clamp(dragRef.current.originY + dy, maxPanY),
    });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoomChange(next: number) {
    setZoom(next);
    // Le pan max change avec le zoom : on re-clamp pour ne pas laisser un
    // bord vide si l'utilisateur dézoome après avoir déplacé l'image.
    const nextScale = baseScale * next;
    if (!naturalSize) return;
    const nextDispW = naturalSize.w * nextScale;
    const nextDispH = naturalSize.h * nextScale;
    const nextMaxX = Math.max(0, (nextDispW - VIEWPORT) / 2);
    const nextMaxY = Math.max(0, (nextDispH - VIEWPORT) / 2);
    setOffset((prev) => ({ x: clamp(prev.x, nextMaxX), y: clamp(prev.y, nextMaxY) }));
  }

  function handleConfirm() {
    if (!naturalSize || !imgRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgX = (VIEWPORT - dispW) / 2 + offset.x;
    const imgY = (VIEWPORT - dispH) / 2 + offset.y;
    const sx = (0 - imgX) / scale;
    const sy = (0 - imgY) / scale;
    const sSize = VIEWPORT / scale;

    ctx.drawImage(imgRef.current, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onConfirm(URL.createObjectURL(blob));
    }, "image/jpeg", 0.9);
  }

  const imgX = (VIEWPORT - dispW) / 2 + offset.x;
  const imgY = (VIEWPORT - dispH) / 2 + offset.y;

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel}>
        <p style={styles.title}>Recadrer la photo</p>

        <div
          style={styles.viewport}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            ref={imgRef}
            src={imageUri}
            draggable={false}
            style={{
              position: "absolute",
              left: imgX,
              top: imgY,
              width: dispW,
              height: dispH,
              maxWidth: "none",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
          <div style={styles.circleMask} />
        </div>

        <div style={styles.zoomRow}>
          <span style={styles.zoomIcon}>−</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            style={styles.zoomSlider}
          />
          <span style={styles.zoomIcon}>+</span>
        </div>

        <div style={styles.actionsRow}>
          <button style={styles.cancelButton} onClick={onCancel}>
            Annuler
          </button>
          <button style={styles.confirmButton} onClick={handleConfirm}>
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },

  panel: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: 340,
    maxWidth: "92vw",
    border: `1px solid ${Colors.border}`,
  },

  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 700,
    margin: "0 0 16px",
    textAlign: "center",
  },

  viewport: {
    position: "relative",
    width: VIEWPORT,
    height: VIEWPORT,
    margin: "0 auto",
    overflow: "hidden",
    borderRadius: VIEWPORT / 2,
    backgroundColor: Colors.background,
    cursor: "grab",
    touchAction: "none",
  },

  circleMask: {
    position: "absolute",
    inset: 0,
    borderRadius: VIEWPORT / 2,
    boxShadow: `inset 0 0 0 2px ${Colors.primary}`,
    pointerEvents: "none",
  },

  zoomRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },

  zoomIcon: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: 700,
    width: 14,
    textAlign: "center",
  },

  zoomSlider: {
    flex: 1,
    accentColor: Colors.primary,
  },

  actionsRow: {
    display: "flex",
    gap: 10,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    border: `1px solid ${Colors.border}`,
    backgroundColor: "transparent",
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  confirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    border: "none",
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};
