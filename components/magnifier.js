// components/magnifier.js
import * as FileSystem from "expo-file-system/legacy";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const Magnifier = forwardRef(
  ({ imageUri, x = 0, y = 0, size = 120, zoom = 3, onColorPicked }, ref) => {
    const lastColor = useRef("#FFFFFF");
    const webViewRef = useRef(null);
    const [src, setSrc] = useState(null);
    const [currentCoords, setCurrentCoords] = useState({ x, y });

    useImperativeHandle(ref, () => ({
      getPickedColor: () => lastColor.current,
      updateCoords: (newX, newY) => {
        // Проверяем, изменились ли координаты значительно
        const deltaX = Math.abs(newX - currentCoords.x);
        const deltaY = Math.abs(newY - currentCoords.y);
        
        if (deltaX > 1 || deltaY > 1) { // Обновляем только при значительном изменении
          setCurrentCoords({ x: newX, y: newY });
          if (webViewRef.current) {
            // Используем injectJavaScript для мгновенного обновления
            webViewRef.current.injectJavaScript(`
              try {
                if (typeof updateCoords === 'function') {
                  updateCoords(${newX}, ${newY});
                }
              } catch(e) {
                console.log('Error updating coords:', e);
              }
              true;
            `);
          }
        }
      },
    }));

    // Конвертация локального файла в base64
    useEffect(() => {
      if (!imageUri) return;

      const prepareSrc = async () => {
        let uri = imageUri;
        if (uri.startsWith("file://") || uri.startsWith("content://")) {
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: "base64",
            });
            let mime = "image/jpeg";
            if (uri.endsWith(".png")) mime = "image/png";
            else if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) mime = "image/jpeg";
            uri = `data:${mime};base64,${base64}`;
          } catch (e) {
            console.error("Ошибка конвертации локального файла:", e);
            return;
          }
        }
        setSrc(uri);
      };

      prepareSrc();
    }, [imageUri]);

    if (!src) return null;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: transparent;
              overflow: hidden;
              width: 100%;
              height: 100%;
            }
            canvas {
              display: block;
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <canvas id="canvas"></canvas>
          <script>
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            const size = ${size};
            const zoom = ${zoom};
            
            canvas.width = size;
            canvas.height = size;

            const cx = Math.floor(size / 2);
            const cy = Math.floor(size / 2);

            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = "${src}";

            let targetX = ${currentCoords.x};
            let targetY = ${currentCoords.y};
            let imgW = 0, imgH = 0;
            let isImageLoaded = false;

            function drawAt(x, y) {
              if (!isImageLoaded) return;

              const srcW = size / zoom;
              const srcH = srcW;

              let sx = x - srcW / 2;
              let sy = y - srcH / 2;

              // Ограничиваем область видимости в пределах изображения
              sx = Math.max(0, Math.min(imgW - srcW, sx));
              sy = Math.max(0, Math.min(imgH - srcH, sy));

              // Отключаем сглаживание для четкого пиксельного увеличения
              ctx.imageSmoothingEnabled = false;
              ctx.mozImageSmoothingEnabled = false;
              ctx.webkitImageSmoothingEnabled = false;
              ctx.msImageSmoothingEnabled = false;

              ctx.clearRect(0, 0, size, size);
              ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, size, size);

              // Получаем цвет центрального пикселя
              try {
                const p = ctx.getImageData(cx, cy, 1, 1).data;
                const r = p[0], g = p[1], b = p[2], a = p[3];
                const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                
                // Отправляем цвет обратно в React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: "color", 
                    hex: hex
                  }));
                }
              } catch(e) {
                console.log('Error getting pixel color:', e);
              }
            }

            function updateCoords(x, y) {
              targetX = Math.max(0, Math.min(imgW, x));
              targetY = Math.max(0, Math.min(imgH, y));
              drawAt(targetX, targetY);
            }

            img.onload = function() {
              imgW = img.naturalWidth;
              imgH = img.naturalHeight;
              isImageLoaded = true;
              drawAt(targetX, targetY);
            };

            // Глобальная функция для вызова из React Native
            window.updateCoords = function(x, y) {
              updateCoords(x, y);
            };
          </script>
        </body>
      </html>
    `;

    return (
      <View style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }]}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html }}
          javaScriptEnabled={true}
          scrollEnabled={false}
          style={{ 
            flex: 1, 
            backgroundColor: "transparent",
            borderRadius: size / 2 
          }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data && data.type === "color" && data.hex) {
                lastColor.current = data.hex;
                if (typeof onColorPicked === "function") {
                  onColorPicked(data.hex);
                }
              }
            } catch (e) {
              console.error("Error parsing color data:", e);
            }
          }}
          onError={(error) => console.error('WebView error:', error)}
        />
        <View style={styles.centerDot} pointerEvents="none" />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#16DBBE",
    zIndex: 1000,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  centerDot: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "red",
    borderWidth: 1,
    borderColor: "white",
    transform: [{ translateX: -3 }, { translateY: -3 }],
    zIndex: 1001,
  },
});

export default Magnifier;