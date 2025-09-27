// components/Magnifier.js
import React, { forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

/**
 * Props:
 *  - imageUri (string) — uri изображения (работает как у твоего PixelPicker)
 *  - x, y (numbers) — координаты в пикселях в системе, которую ты уже используешь (как в PixelPicker)
 *  - size (number) — диаметр лупы, по умолчанию 120
 *  - zoom (number) — во сколько раз увеличиваем (например 3)
 *  - onColorPicked(hex) — колбэк при получении цвета (вызывается при каждом рендере WebView)
 */
const Magnifier = forwardRef(({ imageUri, x = 0, y = 0, size = 120, zoom = 3, onColorPicked }, ref) => {
  const lastColor = useRef("#FFFFFF");

  useImperativeHandle(ref, () => ({
    // синхронно возвращаем последний пришедший цвет
    getPickedColor: () => lastColor.current,
  }));

  // безопасно формируем HTML (с минимальным JS для рисования фрагмента + отправки цвета)
  const html = useMemo(() => {
    // вставляем значения прямо — следим чтобы imageUri помещался в src (как в твоём PixelPicker)
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
              let img = new Image();
              img.crossOrigin = "Anonymous";
              img.src = ${JSON.stringify(imageUri)};
              img.onload = () => {
                try {
                  const canvas = document.getElementById('canvas');
                  const ctx = canvas.getContext('2d');
                  // вычисляем область исходного изображения, которую нужно отрисовать в лупе
                  const srcW = size / zoom;
                  const srcH = srcW;
                  let sx = ${x} - srcW / 2;
                  let sy = ${y} - srcH / 2;
                  // clamp
                  sx = Math.max(0, Math.min(img.width - srcW, sx));
                  sy = Math.max(0, Math.min(img.height - srcH, sy));
                  // отключаем сглаживание — чтобы пиксели были четкие при увеличении
                  if (ctx.imageSmoothingEnabled !== undefined) ctx.imageSmoothingEnabled = false;
                  ctx.clearRect(0,0,size,size);
                  ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, size, size);

                  // Получаем цвет в центре (точно тот пиксель что видит красная точка)
                  try {
                    const p = ctx.getImageData(cx, cy, 1, 1).data;
                    const r = p[0], g = p[1], b = p[2], a = p[3];
                    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    // отправляем в RN
                    window.ReactNativeWebView.postMessage(JSON.stringify({ hex, r, g, b, a }));
                  } catch(e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'getImageData_failed', detail: String(e) }));
                  }
                } catch(err){
                  window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'draw_failed', detail: String(err) }));
                }
              };
              img.onerror = (e) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'img_load_failed' }));
              };
            })();
          </script>
        </body>
      </html>
    `;
  }, [imageUri, x, y, size, zoom]);

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
            } else {
              // можно логать ошибки от canvas (необязательно показывать пользователю)
              // console.warn("Magnifier canvas message:", data);
            }
          } catch (e) {
            // ignore parse errors
          }
        }}
      />
      {/* Центровая красная точка */}
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
