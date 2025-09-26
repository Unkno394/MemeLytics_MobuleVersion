import { useState } from "react";
import { View, Image } from "react-native";
import ViewShot from "react-native-view-shot";

export const useEyedropper = (imageUri, imageLayout) => {
  const [viewShotRef, setViewShotRef] = useState(null);

  const pickColor = async (x, y) => {
    if (!viewShotRef || !imageLayout || !imageUri) return null;

    try {
      const uri = await viewShotRef.capture({
        format: "png",
        quality: 1,
        result: "base64",
      });

      // Конвертируем base64 в RGB вручную (приближенно)
      const raw = atob(uri);
      const r = raw.charCodeAt(0);
      const g = raw.charCodeAt(1);
      const b = raw.charCodeAt(2);

      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)}`;

      return hex;
    } catch (err) {
      console.warn("Eyedropper error:", err);
      return null;
    }
  };

  const EyedropperView = () => (
    <ViewShot
      style={{ width: imageLayout.width, height: imageLayout.height, position: "absolute", top: -1000 }}
      ref={setViewShotRef}
      options={{ format: "png", quality: 1 }}
    >
      <Image source={{ uri: imageUri }} style={{ width: imageLayout.width, height: imageLayout.height }} />
    </ViewShot>
  );

  return { pickColor, EyedropperView };
};
