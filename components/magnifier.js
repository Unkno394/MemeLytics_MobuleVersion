// components/Magnifier.js
import React, { forwardRef, useImperativeHandle, useRef, useMemo, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from 'expo-file-system/legacy';

const Magnifier = forwardRef(({ imageUri, x = 0, y = 0, size = 120, zoom = 3, onColorPicked }, ref) => {
  const lastColor = useRef("#FFFFFF");
  const [src, setSrc] = useState(null);

  useImperativeHandle(ref, () => ({
    getPickedColor: () => lastColor.current,
  }));

  // Конвертируем локальные файлы в base64
  useEffect(() => {
    if (!imageUri) return;

    const prepareSrc = async () => {
      let uri = imageUri;

      if (uri.startsWith("file://") || uri.startsWith("content://")) {
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
          let mime = "image/jpeg";
          if (uri.endsWith(".png")) mime = "image/png";
          else if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) mime = "image/jpeg";
          uri = `data:${mime};base64,${base64}`;
        } catch (e) {
          console.error("Ошибка конвертации локального файла в base64:", e);
          return;
        }
      }

      setSrc(uri);
    };

    prepareSrc();
  }, [imageUri]);

  // HTML для WebView
  const html = useMemo(() => {
    if (!src) return "";

    return `
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
            (function(){
              const size = ${size};
              const zoom = ${zoom};
              const cx = Math.floor(size/2);
              const cy = Math.floor(size/2);
              const targetX = ${x};
              const targetY = ${y};

              const img = new Image();
              img.crossOrigin = "Anonymous";
              img.src = ${JSON.stringify(src)};

              img.onload = () => {
                try {
                  const imgW = img.naturalWidth || img.width;
                  const imgH = img.naturalHeight || img.height;

                  const canvas = document.getElementById('canvas');
                  const ctx = canvas.getContext('2d');

                  const srcW = size / zoom;
                  const srcH = srcW;

                  let sx = targetX - srcW / 2;
                  let sy = targetY - srcH / 2;

                  // clamp по размеру изображения
                  sx = Math.max(0, Math.min(imgW - srcW, sx));
                  sy = Math.max(0, Math.min(imgH - srcH, sy));

                  if (ctx.imageSmoothingEnabled !== undefined) ctx.imageSmoothingEnabled = false;

                  ctx.clearRect(0,0,size,size);
                  ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, size, size);

                  // получаем цвет пикселя в центре
                  try {
                    const p = ctx.getImageData(cx, cy, 1, 1).data;
                    const r = p[0], g = p[1], b = p[2], a = p[3];
                    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    window.ReactNativeWebView.postMessage(JSON.stringify({ hex, r, g, b, a }));
                  } catch(e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'getImageData_failed', detail: String(e) }));
                  }

                } catch(err) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'draw_failed', detail: String(err) }));
                }
              };

              img.onerror = () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'img_load_failed' }));
              };
            })();
          </script>
        </body>
      </html>
    `;
  }, [src, x, y, size, zoom]);

  if (!src) return null; // ждем конвертацию

  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: size/2 }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data && data.hex) {
              lastColor.current = data.hex;
              if (typeof onColorPicked === 'function') onColorPicked(data.hex);
            }
          } catch (e) {}
        }}
      />
      <View style={styles.centerDot} pointerEvents="none" />
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#16DBBE",
    zIndex: 1000,
    backgroundColor: 'transparent',
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
