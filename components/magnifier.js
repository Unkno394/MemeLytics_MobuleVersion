// components/Magnifier.js
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system/legacy";

const Magnifier = forwardRef(
  ({ imageUri, x = 0, y = 0, size = 120, zoom = 3, onColorPicked }, ref) => {
    const lastColor = useRef("#FFFFFF");
    const webViewRef = useRef(null);
    const [src, setSrc] = useState(null);
    const targetCoords = useRef({ x: 0, y: 0 });
    const animationId = useRef(null);
    const isWebViewReady = useRef(false);

    useImperativeHandle(ref, () => ({
      getPickedColor: () => lastColor.current,
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

    // Плавное обновление координат через requestAnimationFrame
    useEffect(() => {
      targetCoords.current = { x, y };
    }, [x, y]);

    // Запуск анимации когда WebView готов
    useEffect(() => {
      if (!isWebViewReady.current || !src) return;

      const updateCoords = () => {
        if (webViewRef.current && isWebViewReady.current) {
          webViewRef.current.postMessage(JSON.stringify({ 
            type: "coords", 
            x: targetCoords.current.x, 
            y: targetCoords.current.y 
          }));
        }
        animationId.current = requestAnimationFrame(updateCoords);
      };
      
      animationId.current = requestAnimationFrame(updateCoords);
      
      return () => {
        if (animationId.current) {
          cancelAnimationFrame(animationId.current);
          animationId.current = null;
        }
      };
    }, [src]);

    if (!src) return null;

    const html = `
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
          <style>
            html,body{margin:0;padding:0;background:transparent;overflow:hidden;}
            canvas{display:block;}
          </style>
        </head>
        <body>
          <canvas id="canvas" width="${size}" height="${size}"></canvas>
          <script>
            const size = ${size};
            const zoom = ${zoom};
            const cx = Math.floor(size/2);
            const cy = Math.floor(size/2);

            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = ${JSON.stringify(src)};

            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            let targetX = ${x};
            let targetY = ${y};
            let imgW = 0, imgH = 0;
            let isImageLoaded = false;
            let animationId = null;

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
              if (ctx.imageSmoothingEnabled !== undefined) {
                ctx.imageSmoothingEnabled = false;
                ctx.mozImageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;
                ctx.msImageSmoothingEnabled = false;
              }

              ctx.clearRect(0, 0, size, size);
              ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, size, size);

              // Получаем цвет центрального пикселя
              try {
                const p = ctx.getImageData(cx, cy, 1, 1).data;
                const r = p[0], g = p[1], b = p[2], a = p[3];
                const hex = "#" + ((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1);
                window.ReactNativeWebView.postMessage(JSON.stringify({ hex, r, g, b, a }));
              } catch(e) {
                // Игнорируем ошибки получения пикселя
              }
            }

            // Плавная анимация через requestAnimationFrame
            function animate() {
              drawAt(targetX, targetY);
              animationId = requestAnimationFrame(animate);
            }

            function stopAnimation() {
              if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
              }
            }

            img.onload = () => {
              imgW = img.naturalWidth || img.width;
              imgH = img.naturalHeight || img.height;
              isImageLoaded = true;
              
              // Запускаем анимацию после загрузки изображения
              animate();
              
              // Сообщаем React, что WebView готов
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ready" }));
            };

            // Обработка сообщений из React Native
            document.addEventListener("message", (e) => {
              try {
                const data = JSON.parse(e.data);
                if (data.type === "coords") {
                  // Плавно обновляем целевые координаты
                  targetX = data.x;
                  targetY = data.y;
                }
              } catch(err) {
                // Игнорируем ошибки парсинга
              }
            });

            // Останавливаем анимацию при уходе со страницы
            window.addEventListener('beforeunload', stopAnimation);
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
          javaScriptEnabled
          scrollEnabled={false}
          style={{ flex: 1, backgroundColor: "transparent" }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              
              if (data.type === "ready") {
                isWebViewReady.current = true;
                return;
              }
              
              if (data && data.hex) {
                lastColor.current = data.hex;
                if (typeof onColorPicked === "function") onColorPicked(data.hex);
              }
            } catch (e) {
              // Игнорируем ошибки парсинга
            }
          }}
          onLoadStart={() => {
            isWebViewReady.current = false;
          }}
          onLoadEnd={() => {
            // Дополнительная проверка готовности
            setTimeout(() => {
              isWebViewReady.current = true;
            }, 100);
          }}
        />
        <View style={styles.centerDot} pointerEvents="none" />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#16DBBE",
    zIndex: 1000,
    backgroundColor: "transparent",
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
  },
});

export default Magnifier;