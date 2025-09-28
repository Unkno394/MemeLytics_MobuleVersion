import React, { useRef, useState, useEffect } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from 'expo-file-system/legacy';

async function fileToBase64(uri) {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    let mime = "image/jpeg";
    if (uri.endsWith(".png")) mime = "image/png";
    else if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) mime = "image/jpeg";
    return `data:${mime};base64,${base64}`;
  } catch (e) {
    console.error("Ошибка конвертации локального файла в base64:", e);
    return null;
  }
}

const PixelPicker = ({ imageUri, x, y, size = 150, zoom = 3, onColorPicked }) => {
  const webRef = useRef(null);
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!imageUri) return;

    const prepare = async () => {
      let src = imageUri;

      // Локальный файл → конвертируем в base64
      if (src.startsWith("file://") || src.startsWith("content://")) {
        const base64 = await fileToBase64(src);
        if (!base64) return;
        src = base64;
      }

      const htmlContent = `
        <html>
        <body style="margin:0;padding:0;overflow:hidden;">
          <canvas id="canvas"></canvas>
          <script>
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = ${JSON.stringify(src)};
            img.onload = () => {
              const canvas = document.getElementById("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);

              function getPixelColor(x, y) {
                const pixel = ctx.getImageData(x, y, 1, 1).data;
                const r = pixel[0];
                const g = pixel[1];
                const b = pixel[2];
                const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                return hex;
              }

              const pixelColor = getPixelColor(${x}, ${y});
              window.ReactNativeWebView.postMessage(pixelColor);
            };
          </script>
        </body>
        </html>
      `;

      setHtml(htmlContent);
    };

    prepare();
  }, [imageUri, x, y]);

  return (
    <View style={{ width: size, height: size, borderWidth: 2, borderColor: "#16DBBE", overflow: "hidden" }}>
      {html !== "" && (
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          javaScriptEnabled
          scrollEnabled={false}
          onMessage={(event) => {
            const color = event.nativeEvent.data;
            onColorPicked?.(color);
          }}
        />
      )}
    </View>
  );
};

export default PixelPicker;
