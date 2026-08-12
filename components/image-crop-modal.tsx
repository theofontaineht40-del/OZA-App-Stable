import { useEffect } from "react";

type Props = {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;
};

// Natif (iOS/Android) : le recadrage carré est déjà géré par l'outil natif de
// l'OS via `allowsEditing`/`aspect` sur ImagePicker, avant même d'arriver ici.
// Cette version ne fait donc que transmettre l'image telle quelle — c'est la
// variante .web.tsx qui contient le vrai recadreur (le navigateur n'a pas
// d'outil de crop natif équivalent).
export default function ImageCropModal({ visible, imageUri, onConfirm }: Props) {
  useEffect(() => {
    if (visible && imageUri) {
      onConfirm(imageUri);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, imageUri]);

  return null;
}
