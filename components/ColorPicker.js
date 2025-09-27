import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PixelPicker = ({ imageUri, x, y, size = 150, zoom = 3, onColorPicked }) => {
  const webRef = useRef(null);
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!imageUri) return;

    const htmlContent = `
      <html>
      <body style="margin:0;padding:0;overflow:hidden;">
        <canvas id="canvas"></canvas>
        <script>
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = "${imageUri}";
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
              const a = pixel[3];
              const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
              return hex;
            }

            // Отправляем цвет пикселя в React Native
            const pixelColor = getPixelColor(${x}, ${y});
            window.ReactNativeWebView.postMessage(pixelColor);
          }
        </script>
      </body>
      </html>
    `;

    setHtml(htmlContent);
  }, [imageUri, x, y]);

  return (
    <View style={{ width: size, height: size, borderWidth: 2, borderColor: "#16DBBE", overflow: "hidden" }}>
      {html !== "" && (
        <WebView
          ref={webRef}
          originWhitelist={['*']}
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
