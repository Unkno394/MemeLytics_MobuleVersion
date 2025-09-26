// utils/pickColorFast.js
import { captureRef } from 'react-native-view-shot';
import Canvas from 'react-native-canvas';

/**
 * Получить цвет пикселя по координатам (x, y) на изображении.
 * @param {Object} params
 * @param {React.RefObject} params.viewRef - ref на Image или View
 * @param {number} params.x - координата X на экране
 * @param {number} params.y - координата Y на экране
 */
export const pickColorFast = async ({ viewRef, x, y }) => {
  if (!viewRef?.current) return null;

  try {
    // 1️⃣ Скриншот через ViewShot в base64
    const uri = await captureRef(viewRef, { format: 'png', quality: 1, result: 'base64' });
    const imageData = `data:image/png;base64,${uri}`;

    // 2️⃣ Создаём canvas
    const canvas = new Canvas(1, 1); // Минимальный размер, только для пикселя
    const ctx = await canvas.getContext('2d');

    // 3️⃣ Загружаем изображение
    const img = new canvas.Image();
    img.src = imageData;

    await new Promise((resolve) => {
      img.addEventListener('load', resolve);
    });

    // 4️⃣ Рисуем только 1 пиксель нужной позиции
    ctx.drawImage(img, -x, -y);

    // 5️⃣ Получаем данные пикселя
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    const [r, g, b] = pixel;

    // 6️⃣ Возвращаем HEX
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`;
  } catch (err) {
    console.error('pickColorFast failed:', err);
    return null;
  }
};
